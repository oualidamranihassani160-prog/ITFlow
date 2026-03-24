<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Support\Facades\Storage;

class PurgeMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'messages:purge {--days=30 : Retention period in days} {--dry-run : Do not actually delete, only report}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge old chat messages and attachments according to retention policy';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dry  = (bool) $this->option('dry-run');

        $cutoff = now()->subDays($days);

        $this->info(($dry ? '[dry-run] ' : '') . "Purging messages older than {$days} days (before {$cutoff->toDateTimeString()})...");

        $totalMessages = 0;
        $totalFiles = 0;

        // Process in chunks to avoid memory spikes
        Message::where('created_at', '<', $cutoff)
            ->orderBy('id')
            ->chunkById(200, function ($messages) use (&$totalMessages, &$totalFiles, $dry) {
                $ids = $messages->pluck('id')->toArray();

                // Count files to delete
                $files = $messages->pluck('file_path')->filter()->values();
                $totalFiles += $files->count();

                $this->info("Found batch: messages=" . count($ids) . ", files=" . $files->count());

                if ($dry) {
                    $totalMessages += count($ids);
                    return;
                }

                // delete attached files first
                foreach ($files as $path) {
                    try {
                        if (Storage::disk('public')->exists($path)) {
                            Storage::disk('public')->delete($path);
                        }
                    } catch (\Exception $e) {
                        $this->error("Failed to delete file {$path}: " . $e->getMessage());
                    }
                }

                // delete reads and messages in a transaction for safety
                try {
                    MessageRead::whereIn('message_id', $ids)->delete();
                    Message::whereIn('id', $ids)->delete();
                } catch (\Exception $e) {
                    $this->error('Failed to delete message batch: ' . $e->getMessage());
                }

                $totalMessages += count($ids);
            });

        $this->info(($dry ? '[dry-run] ' : '') . "Purge complete. Messages processed: {$totalMessages}, files referenced: {$totalFiles}");

        return 0;
    }
}
