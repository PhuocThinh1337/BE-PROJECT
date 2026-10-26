import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

export interface EnterpriseFile { mimetype: string; originalname: string; buffer: Buffer; size: number; }

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
    callback(new BadRequestException('Only PNG, JPG, JPEG, PDF, DOC, or DOCX files are accepted.'), false);
    return;
  }
  callback(null, true);
}

export async function storeEnterpriseFile(file: EnterpriseFile): Promise<string> {
  if (file.size > 5 * 1024 * 1024 || !allowed[file.mimetype]?.includes(extname(file.originalname).toLowerCase())) {
    throw new BadRequestException('The file is invalid or exceeds the 5 MB limit.');
  }
  const directory = join(process.cwd(), 'uploads', 'enterprises');
  const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), file.buffer);
  return `/uploads/enterprises/${filename}`;
}
