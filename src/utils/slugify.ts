// Gera um slug URL-safe a partir de um título.
// Remove acentos, troca espaços por hífens e limpa caracteres especiais.
export function slugify(input: string): string {
  return input
    .normalize('NFD') // separa acentos das letras
    .replace(/\p{Diacritic}/gu, '') // remove os acentos (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove tudo que não for letra/número/espaço/hífen
    .replace(/\s+/g, '-') // espaços -> hífen
    .replace(/-+/g, '-') // colapsa hífens repetidos
    .replace(/^-|-$/g, ''); // remove hífens das pontas
}
