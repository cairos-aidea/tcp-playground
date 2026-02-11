<?php

namespace App\Http\Controllers\Microsoft;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Microsoft\LoginService;

class LoginController extends Controller
{
    public function login (Request $request)
    {
        $msLogin = new LoginService($request->all());
        $msLogin->generateLoginSession($request->session_key);

        if ($msLogin->exceedAttempts('api')) {
            return response()->json(['error' => 'You have exceeded your login attempt.'], 400);
        }

        $data = [
            'url' => $msLogin->generateLoginUrl().'?'.http_build_query($msLogin->getParams($request->base_url)),
        ];

        $msLogin->log($request, 'api', 'pending');
        return response()->json($data, 200);
    }

    public function callback()
    {
        return view('auth.callback');
    }

    public function validateResponse(Request $request)
    {
        $msLogin = new LoginService();

        if (!$request->has('code')) {
            return response()->json(['error' => 'Missing authorization code.'], 400);
        }

        $tokenData = $msLogin->exchangeAuthCodeForTokens($request->code);
        
        // if (!isset($tokenData['access_token'])) {
        //     return response()->json(['error' => $tokenData], 400);
        // }

        // \Log::info("token: ". json_encode($tokenData));

        $request->merge([
            'access_token' => $tokenData['access_token'],
            'refresh_token' => $tokenData['refresh_token'] ?? null,
            'type' => 'api'
        ]);

        // \Log::info("token: ". json_encode($request->all()));

        return $msLogin->handleResponse($request);
    }

    public function validateTeamsToken(Request $request)
    {
        $msLogin = new LoginService();

        if (!$request->has('token')) {
            return response()->json(['error' => 'Missing Teams SSO token.'], 400);
        }

        // \Log::info("Teams SSO token: ". $request->token);

        return $msLogin->fetchUserDetailsFromTeamsToken($request->token);

        // \Log::info("User details: ". json_encode($userDetails));

        // if (!$userDetails) {
        //     return response()->json(['error' => 'Invalid Teams SSO token.'], 400);
        // }

        // return $msLogin->handleResponse($request);
    }
}
