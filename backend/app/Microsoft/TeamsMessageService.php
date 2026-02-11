<?php

namespace App\Microsoft;

use Illuminate\Support\Facades\Http;
use App\Models\User;

class TeamsMessageService
{
    public function refreshAccessToken($email)
    {
        $user = User::where('email', $email)->first();

        if (!$user || !$user->microsoft_refresh_token) {
            return null;
        }
        
        $tenantId = config('microsoft.microsoft_tenant_id');
        $clientId = config('microsoft.microsoft_app_id');
        $clientSecret = config('microsoft.microsoft_secret');

        $response = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
            'grant_type' => 'refresh_token',
            'refresh_token' => $user->microsoft_refresh_token,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'scope' => 'https://graph.microsoft.com/.default',
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $user->microsoft_access_token = $data['access_token'];
            $user->microsoft_refresh_token = $data['refresh_token'] ?? $user->microsoft_refresh_token;
            $user->save();
            return $data['access_token'];
        }

        return null;
    }

    public function validateAccessToken($accessToken, $senderEmail)
    {
        try {
            $response = Http::withToken($accessToken)->get("https://graph.microsoft.com/v1.0/me");
            if ($response->status() === 401) {
                $newToken = $this->refreshAccessToken($senderEmail);
                \Log::info('Access token refreshed', ['new_token' => $newToken]);
                return $newToken;
            }

            return $accessToken;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getUserId($accessToken, $email)
    {
        $accessToken = $this->validateAccessToken($accessToken, $email);
        if (!$accessToken) {
            return null;
        }

        \Log::info('Retrieving user ID', ['accessToken' => $accessToken]);

        try {
            $response = Http::withToken($accessToken)
                ->get("https://graph.microsoft.com/v1.0/users/{$email}");
            $data = $response->json();
            return $data['id'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function sendMessage($accessToken, $senderId, $recipientId, $message)
    {
        try {
            $chatResponse = Http::withToken($accessToken)->post("https://graph.microsoft.com/v1.0/chats", [
                'chatType' => 'oneOnOne',
                'members' => [
                    [
                        '@odata.type' => '#microsoft.graph.aadUserConversationMember',
                        'roles' => ['owner'],
                        'user@odata.bind' => "https://graph.microsoft.com/v1.0/users/{$senderId}"
                    ],
                    [
                        '@odata.type' => '#microsoft.graph.aadUserConversationMember',
                        'roles' => ['owner'],
                        'user@odata.bind' => "https://graph.microsoft.com/v1.0/users/{$recipientId}"
                    ]
                ]
            ]);

            if ($chatResponse->failed()) {
                return ['success' => false, 'error' => 'Failed to create chat.'];
            }

            $chatId = $chatResponse->json()['id'] ?? null;

            if (!$chatId) {
                return ['success' => false, 'error' => 'Chat ID not found.'];
            }

            $messageResponse = Http::withToken($accessToken)->post("https://graph.microsoft.com/v1.0/chats/{$chatId}/messages", [
                'body' => [
                    'contentType' => "html",
                    'content' => $message,
                ]
            ]);

            if ($messageResponse->successful()) {
                return ['success' => true];
            } else {
                return ['success' => false, 'error' => 'Failed to send message.'];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
