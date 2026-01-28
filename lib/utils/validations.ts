/**
 * Utilitários de validação
 * Validações de CPF, CNPJ e dados bancários
 */

/**
 * Limpa CPF/CNPJ removendo caracteres não numéricos
 */
export function limparCPFCNPJ(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * Valida CPF
 * @param cpf CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = limparCPFCNPJ(cpf);
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digito1 = resto === 10 || resto === 11 ? 0 : resto;
  
  if (digito1 !== parseInt(cpfLimpo.charAt(9))) {
    return false;
  }
  
  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digito2 = resto === 10 || resto === 11 ? 0 : resto;
  
  if (digito2 !== parseInt(cpfLimpo.charAt(10))) {
    return false;
  }
  
  return true;
}

/**
 * Valida CNPJ
 * @param cnpj CNPJ com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = limparCPFCNPJ(cnpj);
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return false;
  }
  
  // Valida primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }
  
  // Valida segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }
  
  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente
 * @param cpfCnpj CPF ou CNPJ com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCPFouCNPJ(cpfCnpj: string): boolean {
  const limpo = limparCPFCNPJ(cpfCnpj);
  
  if (limpo.length === 11) {
    return validarCPF(limpo);
  } else if (limpo.length === 14) {
    return validarCNPJ(limpo);
  }
  
  return false;
}

/**
 * Formata CPF
 * @param cpf CPF sem formatação (apenas números)
 * @returns CPF formatado (xxx.xxx.xxx-xx)
 */
export function formatarCPF(cpf: string): string {
  const limpo = limparCPFCNPJ(cpf);
  
  if (limpo.length !== 11) {
    return cpf;
  }
  
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 * @param cnpj CNPJ sem formatação (apenas números)
 * @returns CNPJ formatado (xx.xxx.xxx/xxxx-xx)
 */
export function formatarCNPJ(cnpj: string): string {
  const limpo = limparCPFCNPJ(cnpj);
  
  if (limpo.length !== 14) {
    return cnpj;
  }
  
  return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF ou CNPJ automaticamente
 * @param cpfCnpj CPF ou CNPJ sem formatação
 * @returns CPF ou CNPJ formatado
 */
export function formatarCPFouCNPJ(cpfCnpj: string): string {
  const limpo = limparCPFCNPJ(cpfCnpj);
  
  if (limpo.length === 11) {
    return formatarCPF(limpo);
  } else if (limpo.length === 14) {
    return formatarCNPJ(limpo);
  }
  
  return cpfCnpj;
}

/**
 * Validação básica de dados bancários
 * @param banco Código do banco
 * @param agencia Agência
 * @param conta Conta
 * @returns true se os dados básicos estão preenchidos
 */
export function validarContaBancaria(banco: string, agencia: string, conta: string): boolean {
  // Validação básica: verifica se os campos não estão vazios
  if (!banco || !agencia || !conta) {
    return false;
  }
  
  // Banco deve ter 3 dígitos
  if (banco.length !== 3 || !/^\d+$/.test(banco)) {
    return false;
  }
  
  // Agência deve ter pelo menos 1 dígito
  if (agencia.length === 0 || !/^\d+$/.test(agencia)) {
    return false;
  }
  
  // Conta deve ter pelo menos 1 dígito
  if (conta.length === 0 || !/^\d+$/.test(conta)) {
    return false;
  }
  
  return true;
}

/**
 * Valida email
 * @param email Email para validar
 * @returns true se válido
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida telefone (formato brasileiro)
 * @param telefone Telefone com ou sem formatação
 * @returns true se válido (10 ou 11 dígitos)
 */
export function validarTelefone(telefone: string): boolean {
  const limpo = telefone.replace(/\D/g, '');
  // Aceita telefones com 10 dígitos (fixo) ou 11 dígitos (celular)
  return limpo.length === 10 || limpo.length === 11;
}

/**
 * Valida CEP
 * @param cep CEP com ou sem formatação
 * @returns true se válido (8 dígitos)
 */
export function validarCEP(cep: string): boolean {
  const limpo = cep.replace(/\D/g, '');
  return limpo.length === 8;
}

/**
 * Formata CEP
 * @param cep CEP sem formatação
 * @returns CEP formatado (xxxxx-xxx)
 */
export function formatarCEP(cep: string): string {
  const limpo = cep.replace(/\D/g, '');
  
  if (limpo.length !== 8) {
    return cep;
  }
  
  return limpo.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata telefone
 * @param telefone Telefone sem formatação
 * @returns Telefone formatado
 */
export function formatarTelefone(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '');
  
  if (limpo.length === 10) {
    // Telefone fixo: (xx) xxxx-xxxx
    return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (limpo.length === 11) {
    // Celular: (xx) xxxxx-xxxx
    return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
}
