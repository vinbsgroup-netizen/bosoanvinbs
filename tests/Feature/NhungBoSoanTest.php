<?php

namespace Tests\Feature;

use Tests\TestCase;

class NhungBoSoanTest extends TestCase
{
    public function test_the_embed_script_is_javascript_that_loads_the_current_editor_files(): void
    {
        $phanHoi = $this->get('/api/nhung')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/javascript; charset=utf-8');

        foreach (['ej2.min.js', 'office-kit.js', 'bo-soan.js'] as $tep) {
            $phanHoi->assertSee('"'.$tep.'":'.filemtime(public_path('office-kit/'.$tep)), false);
        }
    }

    public function test_the_embed_script_does_not_start_a_session(): void
    {
        // Mỗi lần mở trang nhúng đều gọi script này; tạo session sẽ ghi một phiên mới mỗi lần.
        $this->get('/api/nhung')->assertCookieMissing(config('session.cookie'));
    }
}
