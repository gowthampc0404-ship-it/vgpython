// A tiny in-browser MySQL-like engine for teaching CBSE Class 12 SQL.
// Supports: CREATE TABLE, INSERT, SELECT (WHERE/ORDER BY/LIMIT/aggregates),
// UPDATE, DELETE, DROP TABLE, SHOW TABLES, DESCRIBE.

export type Value = string | number | null;

export interface Column {
  name: string;
  type: string;
  primary: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
  rows: Record<string, Value>[];
}

export type Database = Record<string, Table>;

export interface QueryResult {
  kind: "rows" | "message" | "error";
  columns?: string[];
  rows?: Record<string, Value>[];
  message?: string;
  affected?: number;
}

const numberish = (v: Value) =>
  typeof v === "number" ? v : v === null ? NaN : Number(v);

function parseLiteral(raw: string): Value {
  const t = raw.trim();
  if (/^null$/i.test(t)) return null;
  if (/^'.*'$/s.test(t) || /^".*"$/s.test(t)) return t.slice(1, -1);
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === sep && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

function likeToRegex(pattern: string) {
  const esc = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + esc.replace(/%/g, ".*").replace(/_/g, ".") + "$", "i");
}

function evalCondition(row: Record<string, Value>, cond: string): boolean {
  const orParts = cond.split(/\s+OR\s+/i);
  if (orParts.length > 1) return orParts.some((p) => evalCondition(row, p));
  const andParts = cond.split(/\s+AND\s+/i);
  if (andParts.length > 1) return andParts.every((p) => evalCondition(row, p));

  const c = cond.trim().replace(/^\((.*)\)$/s, "$1").trim();

  let m = c.match(/^(\w+)\s+IS\s+(NOT\s+)?NULL$/i);
  if (m) {
    const isNull = row[m[1]] === null || row[m[1]] === undefined;
    return m[2] ? !isNull : isNull;
  }

  m = c.match(/^(\w+)\s+(NOT\s+)?LIKE\s+(.+)$/i);
  if (m) {
    const val = row[m[1]];
    const ok = val !== null && likeToRegex(String(parseLiteral(m[3]))).test(String(val));
    return m[2] ? !ok : ok;
  }

  m = c.match(/^(\w+)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (m) {
    const set = splitTopLevel(m[3], ",").map(parseLiteral);
    const ok = set.some((v) => String(v) === String(row[m![1]]));
    return m[2] ? !ok : ok;
  }

  m = c.match(/^(\w+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
  if (m) {
    const v = numberish(row[m[1]]);
    return v >= numberish(parseLiteral(m[2])) && v <= numberish(parseLiteral(m[3]));
  }

  m = c.match(/^(\w+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
  if (!m) return false;
  const [, col, op, rawVal] = m;
  const left = row[col] ?? null;
  const right = parseLiteral(rawVal);
  const bothNum =
    typeof left === "number" || (!Number.isNaN(numberish(left)) && typeof right === "number");
  const a = bothNum ? numberish(left) : String(left ?? "").toLowerCase();
  const b = bothNum ? numberish(right) : String(right ?? "").toLowerCase();
  switch (op) {
    case "=":
      return a === b;
    case "!=":
    case "<>":
      return a !== b;
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    default:
      return false;
  }
}

export function runSql(db: Database, sqlRaw: string): QueryResult {
  const sql = sqlRaw.trim().replace(/;+\s*$/, "");
  if (!sql) return { kind: "error", message: "Empty query." };

  try {
    // SHOW TABLES
    if (/^show\s+tables$/i.test(sql)) {
      return {
        kind: "rows",
        columns: ["Tables_in_school"],
        rows: Object.keys(db).map((t) => ({ Tables_in_school: t })),
      };
    }

    // DESCRIBE / DESC
    let m = sql.match(/^(?:desc|describe)\s+(\w+)$/i);
    if (m) {
      const t = db[m[1].toLowerCase()];
      if (!t) return { kind: "error", message: `Table '${m[1]}' doesn't exist` };
      return {
        kind: "rows",
        columns: ["Field", "Type", "Key"],
        rows: t.columns.map((c) => ({
          Field: c.name,
          Type: c.type,
          Key: c.primary ? "PRI" : "",
        })),
      };
    }

    // CREATE TABLE
    m = sql.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)\s*\(([\s\S]+)\)$/i);
    if (m) {
      const name = m[1].toLowerCase();
      if (db[name]) return { kind: "error", message: `Table '${m[1]}' already exists` };
      const columns: Column[] = [];
      for (const def of splitTopLevel(m[2], ",")) {
        if (/^(primary|foreign|unique|key|constraint)\b/i.test(def)) {
          const pk = def.match(/^primary\s+key\s*\((\w+)\)$/i);
          if (pk) {
            const col = columns.find((c) => c.name.toLowerCase() === pk[1].toLowerCase());
            if (col) col.primary = true;
          }
          continue;
        }
        const parts = def.split(/\s+/);
        columns.push({
          name: parts[0],
          type: (parts[1] ?? "varchar").toUpperCase(),
          primary: /primary\s+key/i.test(def),
        });
      }
      db[name] = { name: m[1], columns, rows: [] };
      return { kind: "message", message: `Table '${m[1]}' created`, affected: 0 };
    }

    // DROP TABLE
    m = sql.match(/^drop\s+table\s+(?:if\s+exists\s+)?(\w+)$/i);
    if (m) {
      const key = m[1].toLowerCase();
      if (!db[key]) return { kind: "error", message: `Unknown table '${m[1]}'` };
      delete db[key];
      return { kind: "message", message: `Table '${m[1]}' dropped` };
    }

    // INSERT
    m = sql.match(/^insert\s+into\s+(\w+)\s*(?:\(([^)]+)\))?\s*values\s*([\s\S]+)$/i);
    if (m) {
      const t = db[m[1].toLowerCase()];
      if (!t) return { kind: "error", message: `Table '${m[1]}' doesn't exist` };
      const cols = m[2]
        ? splitTopLevel(m[2], ",").map((c) => c.trim())
        : t.columns.map((c) => c.name);
      const tuples = splitTopLevel(m[3], ",").filter((s) => s.startsWith("("));
      let n = 0;
      for (const tup of tuples) {
        const vals = splitTopLevel(tup.replace(/^\(|\)$/g, ""), ",").map(parseLiteral);
        if (vals.length !== cols.length)
          return { kind: "error", message: "Column count doesn't match value count" };
        const row: Record<string, Value> = {};
        for (const c of t.columns) row[c.name] = null;
        cols.forEach((c, i) => {
          const real = t.columns.find((x) => x.name.toLowerCase() === c.toLowerCase());
          row[real ? real.name : c] = vals[i];
        });
        t.rows.push(row);
        n++;
      }
      return { kind: "message", message: `Query OK, ${n} row(s) inserted`, affected: n };
    }

    // UPDATE
    m = sql.match(/^update\s+(\w+)\s+set\s+([\s\S]+?)(?:\s+where\s+([\s\S]+))?$/i);
    if (m) {
      const t = db[m[1].toLowerCase()];
      if (!t) return { kind: "error", message: `Table '${m[1]}' doesn't exist` };
      const assigns = splitTopLevel(m[2], ",").map((a) => {
        const i = a.indexOf("=");
        return { col: a.slice(0, i).trim(), expr: a.slice(i + 1).trim() };
      });
      let n = 0;
      for (const row of t.rows) {
        if (m[3] && !evalCondition(row, m[3])) continue;
        for (const a of assigns) {
          const arith = a.expr.match(/^(\w+)\s*([-+*/])\s*(.+)$/);
          if (arith && row[arith[1]] !== undefined) {
            const l = numberish(row[arith[1]]);
            const r = numberish(parseLiteral(arith[3]));
            row[a.col] =
              arith[2] === "+" ? l + r : arith[2] === "-" ? l - r : arith[2] === "*" ? l * r : l / r;
          } else {
            row[a.col] = parseLiteral(a.expr);
          }
        }
        n++;
      }
      return { kind: "message", message: `Query OK, ${n} row(s) updated`, affected: n };
    }

    // DELETE
    m = sql.match(/^delete\s+from\s+(\w+)(?:\s+where\s+([\s\S]+))?$/i);
    if (m) {
      const t = db[m[1].toLowerCase()];
      if (!t) return { kind: "error", message: `Table '${m[1]}' doesn't exist` };
      const before = t.rows.length;
      t.rows = m[2] ? t.rows.filter((r) => !evalCondition(r, m![2])) : [];
      const n = before - t.rows.length;
      return { kind: "message", message: `Query OK, ${n} row(s) deleted`, affected: n };
    }

    // SELECT
    m = sql.match(
      /^select\s+([\s\S]+?)\s+from\s+(\w+)(?:\s+where\s+([\s\S]+?))?(?:\s+group\s+by\s+(\w+))?(?:\s+order\s+by\s+(\w+)(\s+asc|\s+desc)?)?(?:\s+limit\s+(\d+))?$/i
    );
    if (m) {
      const [, selectList, tableName, where, groupBy, orderBy, dir, limit] = m;
      const t = db[tableName.toLowerCase()];
      if (!t) return { kind: "error", message: `Table '${tableName}' doesn't exist` };

      let rows = where ? t.rows.filter((r) => evalCondition(r, where)) : [...t.rows];

      const items = splitTopLevel(selectList, ",");
      const isAgg = items.some((i) => /^(count|sum|avg|min|max)\s*\(/i.test(i));

      const aggregate = (group: Record<string, Value>[]) => {
        const out: Record<string, Value> = {};
        for (const item of items) {
          const a = item.match(/^(count|sum|avg|min|max)\s*\(\s*(\*|\w+)\s*\)(?:\s+as\s+(\w+))?$/i);
          if (a) {
            const fn = a[1].toLowerCase();
            const col = a[2];
            const label = a[3] ?? `${fn.toUpperCase()}(${col})`;
            if (fn === "count") {
              out[label] =
                col === "*" ? group.length : group.filter((r) => r[col] !== null).length;
            } else {
              const nums = group
                .map((r) => numberish(r[col]))
                .filter((v) => !Number.isNaN(v));
              const v =
                fn === "sum"
                  ? nums.reduce((s, x) => s + x, 0)
                  : fn === "avg"
                    ? nums.reduce((s, x) => s + x, 0) / (nums.length || 1)
                    : fn === "min"
                      ? Math.min(...nums)
                      : Math.max(...nums);
              out[label] = Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
            }
          } else {
            const plain = item.replace(/\s+as\s+\w+$/i, "").trim();
            out[item.trim()] = group[0]?.[plain] ?? null;
          }
        }
        return out;
      };

      if (groupBy) {
        const groups = new Map<string, Record<string, Value>[]>();
        for (const r of rows) {
          const k = String(r[groupBy]);
          groups.set(k, [...(groups.get(k) ?? []), r]);
        }
        const result = [...groups.entries()].map(([, g]) => aggregate(g));
        return { kind: "rows", columns: Object.keys(result[0] ?? {}), rows: result };
      }

      if (isAgg) {
        const result = [aggregate(rows)];
        return { kind: "rows", columns: Object.keys(result[0]), rows: result };
      }

      if (orderBy) {
        const desc = /desc/i.test(dir ?? "");
        rows.sort((a, b) => {
          const x = a[orderBy];
          const y = b[orderBy];
          const cmp =
            typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x ?? "").localeCompare(String(y ?? ""));
          return desc ? -cmp : cmp;
        });
      }
      if (limit) rows = rows.slice(0, Number(limit));

      const star = items.length === 1 && items[0].trim() === "*";
      const distinct = /^distinct\s+/i.test(selectList.trim());
      if (star) {
        return { kind: "rows", columns: t.columns.map((c) => c.name), rows };
      }
      const cols = splitTopLevel(selectList.replace(/^distinct\s+/i, ""), ",").map((c) =>
        c.trim()
      );
      let projected = rows.map((r) => {
        const o: Record<string, Value> = {};
        for (const c of cols) {
          const alias = c.match(/^(\w+)\s+as\s+(\w+)$/i);
          if (alias) o[alias[2]] = r[alias[1]] ?? null;
          else o[c] = r[c] ?? null;
        }
        return o;
      });
      if (distinct) {
        const seen = new Set<string>();
        projected = projected.filter((r) => {
          const k = JSON.stringify(r);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      return {
        kind: "rows",
        columns: cols.map((c) => c.replace(/^(\w+)\s+as\s+(\w+)$/i, "$2")),
        rows: projected,
      };
    }

    return {
      kind: "error",
      message: `Sorry, this simulator doesn't understand that statement yet.`,
    };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Could not run that query",
    };
  }
}

export function seedDatabase(): Database {
  const db: Database = {};
  runSql(
    db,
    "CREATE TABLE student (rollno INT PRIMARY KEY, name VARCHAR(30), stream VARCHAR(20), marks INT, city VARCHAR(20))"
  );
  runSql(
    db,
    `INSERT INTO student (rollno, name, stream, marks, city) VALUES
     (1,'Aarav','Science',92,'Chennai'),
     (2,'Diya','Commerce',78,'Madurai'),
     (3,'Kabir','Science',65,'Chennai'),
     (4,'Meera','Humanities',88,'Salem'),
     (5,'Rohan','Science',54,'Madurai')`
  );
  runSql(
    db,
    "CREATE TABLE library (bookid INT PRIMARY KEY, title VARCHAR(40), author VARCHAR(30), price INT)"
  );
  runSql(
    db,
    `INSERT INTO library VALUES
     (101,'Python Basics','Guido',450),
     (102,'MySQL Made Easy','Widenius',380),
     (103,'Data Structures','Knuth',700)`
  );
  return db;
}
