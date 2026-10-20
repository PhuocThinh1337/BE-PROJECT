import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export interface UploadedAvatar {
  mimetype: string;
  buffer: Buffer;
}

export async function storeAvatar(avatar: UploadedAvatar): Promise<string> {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  const extension = extensions[avatar.mimetype];
  if (!extension) throw new BadRequestException('Ảnh đại diện phải có định dạng JPEG, PNG hoặc WebP.');
  const directory = join(process.cwd(), 'uploads', 'avatars');
  const filename = `${randomUUID()}${extension}`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), avatar.buffer);
  return `/uploads/avatars/${filename}`;
}
