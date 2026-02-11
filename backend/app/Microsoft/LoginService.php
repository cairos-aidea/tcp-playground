<?php

namespace App\Microsoft;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\UserLoginLogger;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LoginService
{

    private $config;

    public function __construct($config = [])
    {
        $this->config = array_merge(config('microsoft'), $config);
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function generateLoginSession($session_key = '')
    {
        if (empty(session()->get('login_key'))) {
            if (!empty($session_key)) {
                session()->put('login_key', $session_key);
            } else {
                session()->put('login_key', \Str::random(16));
            }
        }
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function generateLoginUrl()
    {
        return 'https://login.microsoftonline.com/' . $this->config['microsoft_tenant_id'] . '/oauth2/v2.0/authorize';
    }


    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function getLogoutUrl()
    {
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/logout?' . http_build_query(['post_logout_redirect_uri' => url('/')]);
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function getParams($base_url = '')
    {
        return [
            'client_id' => $this->config['microsoft_app_id'],
            'redirect_uri' => !empty($base_url) ? $base_url . '/ms/login/callback' : url('/ms/login/callback'),
            'response_type' => 'code',
            'scope' => $this->config['microsoft_scope'],
            'state' => session()->get('login_key')
        ];
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function exchangeAuthCodeForTokens($code)
    {
        $tokenEndpoint = "https://login.microsoftonline.com/" . $this->config['microsoft_tenant_id'] . "/oauth2/v2.0/token";

        $response = Http::asForm()
            ->withOptions(['verify' => false])
            ->post($tokenEndpoint, [
                'client_id' => $this->config['microsoft_app_id'],
                'client_secret' => $this->config['microsoft_secret'],
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $this->config['microsoft_redirect_uri'] . "/ms/login/callback",
                'scope' => $this->config['microsoft_scope']
            ]);

        return $response->json();
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    protected function getProfileImage($accessToken)
    {
        try {
            $response = Http::withToken($accessToken)
                ->get('https://graph.microsoft.com/v1.0/me/photo/$value');

            // If the response is successful (status 200), it's a binary stream
            if ($response->successful()) {
                return base64_encode($response->body());
            }

            // If not successful, check if it's an ImageNotFound error
            $json = @json_decode($response->body(), true);
            if (is_array($json) && isset($json['error']['code']) && $json['error']['code'] === 'ImageNotFound') {
                return null;
            }

            return null;
        } catch (\Exception $e) {
            // Optional: log error
            // \Log::error('Profile image fetch error: ' . $e->getMessage());
            return null;
        }
    }


    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function handleResponse(Request $request)
    {

        if (empty(session()->get('login_key'))) {
            session()->put('login_key', $request->state);
        }

        $response = $this->fetchUserDetails($request);
        $type = !empty($request->request_from) ? $request->request_from : 'api';

        if (!empty($response['error'])) {
            $this->log($request, $type, 'failed');
            return response()->json(['message' => $response['error']['message']], 400);
        }
        
        /* #################################### SAMPLE VALIDATION RETURN DATA  #################################### */

        // {
        //     "@odata.context": "https:\/\/graph.microsoft.com\/v1.0\/$metadata#users\/$entity",
        //     "businessPhones": [],
        //     "displayName": "***********************",
        //     "givenName": "***********************",
        //     "jobTitle": "Software Engineer",
        //     "mail": "****************************",
        //     "mobilePhone": null,
        //     "officeLocation": null,
        //     "preferredLanguage": null,
        //     "surname": "***********************",
        //     "userPrincipalName": "***********************",
        //     "id": ***********************"
        // }

        /* #################################### SAMPLE VALIDATION RETURN DATA  #################################### */

        // Accept both mail and userPrincipalName if either matches the domain, or fallback to userPrincipalName if mail is empty
        $corporateDomain = env("CORPORATE_EMAIL_DOMAIN");
        if (!empty($response['mail']) && (empty($corporateDomain) || strpos($response['mail'], $corporateDomain) !== false)) {
            $email = $response['mail'];
        } else if (!empty($response['userPrincipalName']) && (empty($corporateDomain) || strpos($response['userPrincipalName'], $corporateDomain) !== false)) {
            $email = $response['userPrincipalName'];
        } else {
            $this->log($request, $type, 'failed');
            return response()->json(['message' => 'No email found for this user. Please contact your IT Administrator.'], 400);
        }

        $profileImage = $this->getProfileImage($request->access_token);

        $users = User::where('email', $email)->with('department')->get();

        // Filter for active users
        $user = $users->first(function ($u) {
            return isset($u->is_active) && strtolower($u->is_active) === 'yes' && is_null($u->deleted_at);
        });

        // If no active user found, set $user to null
        if (!$user) {
            $this->log($request, $type, 'failed');
            return response()->json(['message' => 'No active user found for this email.'], 400);
        }

        if (!empty($user)) {
            if ((isset($user->is_active) && strtolower($user->is_active) !== 'yes') || (!is_null($user->deleted_at))) {
            $this->log($request, $type, 'failed');
            return response()->json(['message' => 'No email found for this user. Please contact your IT Administrator.'], 400);
            }
            // user already exist in db, so just generate token
            $this->log($request, $type, 'success');
            $user->microsoft_access_token = $request->access_token ?? null;
            $user->microsoft_refresh_token = $request->refresh_token ?? null;
            $user->profile = $profileImage ?? null;
            $user->save();

            return $this->userTokenSession($user, $request);
        }

        // else {
        //     // user doesnt exist in db, so create entry based on microsoft data, then generate token
        //     $res = $this->createUserEntry($request, $response);
        //     if ($res['success']) {
        //         $this->log($request, $type, 'success');
        //         return $this->userTokenSession($res['user'], $request);
        //     } else {
        //         $this->log($request, $type, 'failed');
        //         return response()->json(['message' => $res['message']], 400);
        //     }
        // }

        $this->log($request, $type, 'failed');
        return response()->json(['message' => 'An unexpected error has occured. Please contact your IT Administrator.'], 400);

        return $response;
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function log(Request $request, $type, $response)
    {
        $userLoginLogger = $this->getLog($type);
        if (!$userLoginLogger) {
            $userLoginLogger = new UserLoginLogger();
            $userLoginLogger->user_ip = $this->getUserIp();
            $userLoginLogger->type = $type;
            $userLoginLogger->session = session()->get('login_key');
        }

        $userLoginLogger->user_id = Auth::check() ? Auth::user()->id : 0;
        if ($response != 'success') {
            $userLoginLogger->attempts = (int)++$userLoginLogger->attempts;
        }
        $userLoginLogger->response = $response;
        $userLoginLogger->save();
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function exceedAttempts($type)
    {
        if ($attempts = $this->getLog($type)) {
            return $attempts->attempts >= 3;
        }
        return false;
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function getLog($type)
    {

        $attempts = UserLoginLogger::where('user_ip', $this->getUserIp())
            ->where('type', $type)
            ->where('updated_at', '>', Carbon::now()->subHour(1))
            ->where('response', '!=', 'success')
            ->where('session', session()->get('login_key'))
            ->first();
        return $attempts;
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function getUserIp()
    {
        foreach (array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR') as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip); // just to be safe
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return \Request::ip();
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function userTokenSession($user, $request)
    {
        session()->forget('login_key');
        if ($request->has('type') && $request->type == 'api') {
            // if user is already existing
            return response()->json([
                'user'  => $user,
                'token' => $user->createToken('Aidea')
            ], 200);
        } else {
            // if user has been created, then force login the details
            // Auth::login($user);
            return response()->json([], 200);
        }
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function createUserEntry($request, $response)
    {
        try {
            foreach ($this->config['mapping'] as $key => $col) {
                if (!empty($response[$col])) {
                    $request->merge([$key => $response[$col]]);
                }
            }

            $request->merge(['user_type' => $this->getUserType($response['jobTitle'])]);

            $first_name = $response['givenName'];
            $last_name = $response['surname'];
            $job_title = $response['jobTitle'];
            $name = $response['displayName'];

            $user = User::create([
                'email'                     => $request->get('email', ''),
                'password'                  => bcrypt(env("DEFAULT_PASSWORD")),
                'microsoft_access_token'    => $request->access_token,

                'name'                      => $name,
                'first_name'                => $first_name,
                'last_name'                 => $last_name,
                'job_title'                 => $job_title,

                'status'                    => "active",
                'user_type'                 => null
            ]);

            Auth::login($user);
            return ['success' => true, 'user' => $user];
        } catch (\Throwable $th) {
            return ['success' => false, 'message' => $th->getMessage()];
        }
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function fetchUserDetails($request)
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://graph.microsoft.com/v1.0/me',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => array(
                'ConsistencyLevel: eventual',
                'Authorization: Bearer ' . $request->access_token
            ),
        ));

        $response = curl_exec($curl);
        
        curl_close($curl);
        return json_decode($response, true);
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function getUserType($job)
    {
        if (in_array($job, $this->config['user_roles']['tma'])) {
            return 'tma';
        } else if (in_array($job, $this->config['user_roles']['doctor'])) {
            return 'doctor';
        } else if (in_array($job, $this->config['user_roles']['admin'])) {
            return 'admin';
        } else {
            return 'generic';
        }
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function validateSessionKey($type)
    {
        if (!empty($this->getLog($type))) {
            return true;
        }
        session()->forget('login_key');
        return false;
    }

    /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    public function fetchUserDetailsFromTeamsToken($token)
    {
        $tenantId = $this->config['microsoft_tenant_id'];
        $clientId = $this->config['microsoft_app_id'];
        $clientSecret = $this->config['microsoft_secret'];
        $scope = $this->config['microsoft_scope'] ?? 'https://graph.microsoft.com/.default';

        // Exchange Teams token for Graph token (OBO flow)
        $oboResponse = Http::asForm()->post("https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token", [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'requested_token_use' => 'on_behalf_of',
            'scope' => $scope,
            'assertion' => $token,
        ]);

        \Log::info("oboResponse: ". $oboResponse->body());

        $oboData = $oboResponse->json();

        if (empty($oboData['access_token'])) {
            return response()->json([
                'message' => 'Failed to exchange token for Microsoft Graph access.',
                'error' => $oboData,
            ], 400);
        }

        // \Log::info("oboData: ". json_encode($oboData));

        $graphToken = $oboData['access_token'];
        $refreshToken = $oboData['refresh_token'] ?? null;

        // Fetch user details
        $graphResponse = Http::withToken($graphToken)->get('https://graph.microsoft.com/v1.0/me');

        if ($graphResponse->failed()) {
            return response()->json(['message' => 'Failed to fetch user details from Microsoft Graph.'], 400);
        }

        // \Log::info("graphResponse: ". $graphResponse->body());

        $graphUser = $graphResponse->json();
        $corporateDomain = env("CORPORATE_EMAIL_DOMAIN");

        $email = null;
        if (!empty($graphUser['mail']) && (empty($corporateDomain) || str_contains($graphUser['mail'], $corporateDomain))) {
            $email = $graphUser['mail'];
        } elseif (!empty($graphUser['userPrincipalName']) && (empty($corporateDomain) || str_contains($graphUser['userPrincipalName'], $corporateDomain))) {
            $email = $graphUser['userPrincipalName'];
        }

        if (empty($email)) {
            return response()->json(['message' => 'No email found for this user.'], 400);
        }

        // \Log::info("graphUser: ". json_encode($graphUser));

        $profileImage = $this->getProfileImage($graphToken);
        $users = User::where('email', $email)->with('department')->get();

        // Filter for active users
        $user = $users->first(function ($u) {
            return isset($u->is_active) && strtolower($u->is_active) === 'yes' && is_null($u->deleted_at);
        });

        // If no active user found, set $user to null
        if (!$user) {
            return response()->json(['message' => 'No active user found for this email.'], 400);
        }

        if ($user) {
            if ((isset($user->is_active) && strtolower($user->is_active) !== 'yes') || !is_null($user->deleted_at)) {
                return response()->json(['message' => 'This user is inactive or deleted. Please contact IT.'], 403);
            }

            $user->microsoft_access_token = $graphToken;
            $user->microsoft_refresh_token = $refreshToken;
            $user->profile = $profileImage ?? null;
            $user->save();

            $request = new Request();

            $request->merge([
                'access_token' => $graphToken,
                'refresh_token' => $refreshToken,
                'type' => 'api'
            ]);

            return $this->userTokenSessionTeams($user, $request);
        }

        // \Log::info("User not found: ". json_encode($request->all()));

        return response()->json(['message' => 'User not found in the system. Please contact IT.'], 400);
    }

     /* ******************************************* FUNCTION SEPARATOR ******************************************* */

    private function userTokenSessionTeams($user, $request)
    {
        if ($request->has('type') && $request->type == 'api') {
            // if user is already existing
            return response()->json([
                'user'  => $user,
                'token' => $user->createToken('Aidea')
            ], 200);
        } else {
            // if user has been created, then force login the details
            // Auth::login($user);
            return response()->json([], 200);
        }
    }
}
