export function paginate(page: number, limit: number) {
  const take = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
}

export function buildPagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
