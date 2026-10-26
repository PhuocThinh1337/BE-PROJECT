export class PageResponseDto<T> {
  message: string;
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
