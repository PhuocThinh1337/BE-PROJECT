import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

export interface EnterpriseFile { mimetype: string; originalname: string; buffer: Buffer; size: number; }
export interface StoredEnterpriseFile {
  fileId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

const allowed: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function enterpriseFileFilter(_request: unknown, file: EnterpriseFile, callback: (error: Error | null, accept: boolean) => void) {
  const extension = extname(file.originalname).toLowerCase();
  if (!allowed[file.mimetype]?.includes(extension)) {
    callback(new BadRequestException('Chỉ chấp nhận tệp PNG, JPG, JPEG, PDF, DOC hoặc DOCX.'), false);
    return;
  }
  callback(null, true);
}

export async function storeEnterpriseFile(file: EnterpriseFile): Promise<StoredEnterpriseFile> {
  if (file.size > 5 * 1024 * 1024 || !allowed[file.mimetype]?.includes(extname(file.originalname).toLowerCase())) {
    throw new BadRequestException('Tệp không hợp lệ hoặc vượt quá dung lượng tối đa 5 MB.');
  }
  const directory = join(process.cwd(), 'uploads', 'enterprises');
  const fileId = randomUUID();
  const extension = extname(file.originalname).toLowerCase();
  const filename = `${fileId}${extension}`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), file.buffer);
  return {
    fileId,
    fileName: file.originalname.split(/[\\/]/).pop() || filename,
    contentType: file.mimetype,
    size: file.size,
    url: `/uploads/enterprises/${filename}`,
  };
}
