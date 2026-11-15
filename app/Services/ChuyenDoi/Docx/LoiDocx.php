<?php

namespace App\Services\ChuyenDoi\Docx;

use InvalidArgumentException;

/**
 * File DOCX hỏng hoặc không phải DOCX: thông điệp đọc được cho người dùng (controller trả 422).
 */
final class LoiDocx extends InvalidArgumentException {}
