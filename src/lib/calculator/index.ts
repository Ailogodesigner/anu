/**
 * Safe Arithmetic Parser and VPS Hosting Price Calculator
 *
 * Implements a strict mathematical tokenizer and Pratt/recursive parser
 * completely free of eval(), new Function(), or RegExp code execution vulnerabilities.
 */

export interface VpsSpecs {
  cpu: number;        // vCPU cores (e.g. 1, 2, 4, 8, 16)
  ram: number;        // RAM in GB (e.g. 2, 4, 8, 16, 32, 64)
  nvme: number;       // NVMe SSD in GB (e.g. 25, 50, 100, 200, 500)
  bandwidth: number;  // Bandwidth in TB (e.g. 1, 2, 5, 10, 20)
  ipv4: number;       // Dedicated IPv4 count (e.g. 1, 2, 4)
  ddosTier: "standard" | "advanced" | "enterprise";
  backupTier: "none" | "weekly" | "daily";
}

export interface PricingConfig {
  basePrice: number;
  cpuCorePrice: number;
  ramGbPrice: number;
  nvmeGbPrice: number;
  bandwidthTbPrice: number;
  ipv4Price: number;
  ddosTierPrice: Record<string, number>;
  backupTierPrice: Record<string, number>;
  formulaExpression: string;
}

export interface CalculationResult {
  monthlyPrice: number;
  yearlyPrice: number;
  itemized: {
    base: number;
    cpu: { count: number; unitPrice: number; total: number };
    ram: { count: number; unitPrice: number; total: number };
    nvme: { count: number; unitPrice: number; total: number };
    bandwidth: { count: number; unitPrice: number; total: number };
    ipv4: { count: number; unitPrice: number; total: number };
    ddos: { tier: string; cost: number };
    backup: { tier: string; cost: number };
  };
  isValid: boolean;
  error?: string;
}

type TokenType = "NUMBER" | "IDENT" | "PLUS" | "MINUS" | "MUL" | "DIV" | "LPAREN" | "RPAREN";

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenize a math expression
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(expression[i + 1] || ""))) {
      let numStr = "";
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        numStr += expression[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: numStr });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let ident = "";
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        ident += expression[i];
        i++;
      }
      tokens.push({ type: "IDENT", value: ident });
      continue;
    }

    if (char === "+") {
      tokens.push({ type: "PLUS", value: "+" });
      i++;
      continue;
    }

    if (char === "-") {
      tokens.push({ type: "MINUS", value: "-" });
      i++;
      continue;
    }

    if (char === "*") {
      tokens.push({ type: "MUL", value: "*" });
      i++;
      continue;
    }

    if (char === "/") {
      tokens.push({ type: "DIV", value: "/" });
      i++;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    throw new Error(`Disallowed character in arithmetic formula: '${char}'`);
  }

  return tokens;
}

/**
 * Recursive descent safe mathematical expression parser
 */
class SafeExpressionParser {
  private tokens: Token[];
  private pos = 0;
  private variables: Record<string, number>;

  constructor(tokens: Token[], variables: Record<string, number>) {
    this.tokens = tokens;
    this.variables = variables;
  }

  parse(): number {
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}: '${this.tokens[this.pos].value}'`);
    }
    return result;
  }

  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type === "PLUS") {
        this.pos++;
        left += this.parseTerm();
      } else if (token.type === "MINUS") {
        this.pos++;
        left -= this.parseTerm();
      } else {
        break;
      }
    }

    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type === "MUL") {
        this.pos++;
        left *= this.parseFactor();
      } else if (token.type === "DIV") {
        this.pos++;
        const divisor = this.parseFactor();
        if (divisor === 0) {
          throw new Error("Division by zero in formula");
        }
        left /= divisor;
      } else {
        break;
      }
    }

    return left;
  }

  private parseFactor(): number {
    if (this.pos >= this.tokens.length) {
      throw new Error("Unexpected end of expression");
    }

    const token = this.tokens[this.pos];

    if (token.type === "NUMBER") {
      this.pos++;
      const val = parseFloat(token.value);
      if (isNaN(val)) throw new Error(`Invalid numeric token: ${token.value}`);
      return val;
    }

    if (token.type === "IDENT") {
      this.pos++;
      if (!(token.value in this.variables)) {
        throw new Error(`Undefined variable in formula: '${token.value}'`);
      }
      return this.variables[token.value];
    }

    if (token.type === "MINUS") {
      this.pos++;
      return -this.parseFactor();
    }

    if (token.type === "PLUS") {
      this.pos++;
      return this.parseFactor();
    }

    if (token.type === "LPAREN") {
      this.pos++;
      const subResult = this.parseExpression();
      if (this.pos >= this.tokens.length || this.tokens[this.pos].type !== "RPAREN") {
        throw new Error("Mismatched parenthesis: missing ')'");
      }
      this.pos++; // consume ')'
      return subResult;
    }

    throw new Error(`Unexpected token '${token.value}'`);
  }
}

/**
 * Evaluate arithmetic formula safely with variable bindings
 */
export function evaluateSafeFormula(expression: string, variables: Record<string, number>): number {
  if (!expression || typeof expression !== "string") {
    throw new Error("Empty or invalid formula expression");
  }

  const tokens = tokenize(expression);
  const parser = new SafeExpressionParser(tokens, variables);
  const val = parser.parse();

  if (!isFinite(val) || isNaN(val)) {
    throw new Error("Expression resulted in non-finite value or NaN");
  }

  return Math.max(0, val);
}

/**
 * Calculate total hosting cost with itemized breakdown
 */
export function calculateVpsPricing(specs: VpsSpecs, config: PricingConfig): CalculationResult {
  const ddosCost = config.ddosTierPrice[specs.ddosTier] ?? 0;
  const backupCost = config.backupTierPrice[specs.backupTier] ?? 0;

  const variables: Record<string, number> = {
    base: Math.max(0, config.basePrice),
    cpu: Math.max(1, specs.cpu),
    cpuPrice: Math.max(0, config.cpuCorePrice),
    ram: Math.max(1, specs.ram),
    ramPrice: Math.max(0, config.ramGbPrice),
    nvme: Math.max(10, specs.nvme),
    nvmePrice: Math.max(0, config.nvmeGbPrice),
    bw: Math.max(1, specs.bandwidth),
    bwPrice: Math.max(0, config.bandwidthTbPrice),
    ip: Math.max(1, specs.ipv4),
    ipPrice: Math.max(0, config.ipv4Price),
    ddos: ddosCost,
    backup: backupCost,
  };

  try {
    const rawTotal = evaluateSafeFormula(config.formulaExpression, variables);
    const monthlyPrice = Number(rawTotal.toFixed(2));
    // 10% discount on 12 months prepayment
    const yearlyPrice = Number((monthlyPrice * 12 * 0.9).toFixed(2));

    return {
      monthlyPrice,
      yearlyPrice,
      itemized: {
        base: config.basePrice,
        cpu: { count: specs.cpu, unitPrice: config.cpuCorePrice, total: Number((specs.cpu * config.cpuCorePrice).toFixed(2)) },
        ram: { count: specs.ram, unitPrice: config.ramGbPrice, total: Number((specs.ram * config.ramGbPrice).toFixed(2)) },
        nvme: { count: specs.nvme, unitPrice: config.nvmeGbPrice, total: Number((specs.nvme * config.nvmeGbPrice).toFixed(2)) },
        bandwidth: { count: specs.bandwidth, unitPrice: config.bandwidthTbPrice, total: Number((specs.bandwidth * config.bandwidthTbPrice).toFixed(2)) },
        ipv4: { count: specs.ipv4, unitPrice: config.ipv4Price, total: Number((specs.ipv4 * config.ipv4Price).toFixed(2)) },
        ddos: { tier: specs.ddosTier, cost: ddosCost },
        backup: { tier: specs.backupTier, cost: backupCost },
      },
      isValid: true,
    };
  } catch (err: any) {
    return {
      monthlyPrice: 0,
      yearlyPrice: 0,
      itemized: {
        base: 0,
        cpu: { count: 0, unitPrice: 0, total: 0 },
        ram: { count: 0, unitPrice: 0, total: 0 },
        nvme: { count: 0, unitPrice: 0, total: 0 },
        bandwidth: { count: 0, unitPrice: 0, total: 0 },
        ipv4: { count: 0, unitPrice: 0, total: 0 },
        ddos: { tier: "standard", cost: 0 },
        backup: { tier: "none", cost: 0 },
      },
      isValid: false,
      error: err.message || "Failed to calculate hosting price",
    };
  }
}
