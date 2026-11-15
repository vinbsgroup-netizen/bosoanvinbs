<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

use InvalidArgumentException;

/**
 * SFDT không đọc được (không phải JSON, thiếu sections): thông điệp đọc được cho người dùng.
 */
final class LoiSfdt extends InvalidArgumentException {}
