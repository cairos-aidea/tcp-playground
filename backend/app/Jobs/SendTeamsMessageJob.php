<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Microsoft\TeamsMessageService;
use Illuminate\Support\Facades\Log;

class SendTeamsMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $accessToken;
    protected string $senderEmail;
    protected string $recipientEmail;
    protected string $message;

    /**
     * Create a new job instance.
     */
    public function __construct(string $accessToken, string $senderEmail, string $recipientEmail, string $message)
    {
        $this->accessToken = $accessToken;
        $this->senderEmail = $senderEmail;
        $this->recipientEmail = $recipientEmail;
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $teams = new TeamsMessageService();
        $result = $teams->sendMessage(
            $this->accessToken,
            $this->senderEmail,
            $this->recipientEmail,
            $this->message
        );

        // Optional logging
        if ($result['success']) {
            // Log::info("Teams message sent to {$this->recipientEmail}");
        } else {
            // Log::warning("Failed to send Teams message to {$this->recipientEmail}: " . $result['error']);
        }
    }
}
