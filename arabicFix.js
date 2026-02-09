'use strict';

const CP_ZWNJ = 0x200C;
const CP_ZWJ = 0x200D;

function cp(ch) { return ch.codePointAt(0); }
function ch(code) { return String.fromCodePoint(code); }

function isCombiningMark(code) {
  return (
    (code >= 0x0610 && code <= 0x061A) ||
    (code >= 0x064B && code <= 0x065F) ||
    code === 0x0670 ||
    (code >= 0x06D6 && code <= 0x06ED)
  );
}

function isWhitespace(code) {
  return (
    code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0D ||
    code === 0x0B || code === 0x0C || code === 0xA0 ||
    code === 0x1680 || (code >= 0x2000 && code <= 0x200B) ||
    code === 0x202F || code === 0x205F || code === 0x3000
  );
}

// jp: joins to previous? jn: joins to next?
const Letters = {
  0x0621: { iso: 0xFE80, fin: null, ini: null, med: null, jp: false, jn: false },
  0x0622: { iso: 0xFE81, fin: 0xFE82, ini: null, med: null, jp: true, jn: false },
  0x0623: { iso: 0xFE83, fin: 0xFE84, ini: null, med: null, jp: true, jn: false },
  0x0624: { iso: 0xFE85, fin: 0xFE86, ini: null, med: null, jp: true, jn: false },
  0x0625: { iso: 0xFE87, fin: 0xFE88, ini: null, med: null, jp: true, jn: false },
  0x0626: { iso: 0xFE89, fin: 0xFE8A, ini: 0xFE8B, med: 0xFE8C, jp: true, jn: true },
  0x0627: { iso: 0xFE8D, fin: 0xFE8E, ini: null, med: null, jp: true, jn: false },
  0x0628: { iso: 0xFE8F, fin: 0xFE90, ini: 0xFE91, med: 0xFE92, jp: true, jn: true },
  0x0629: { iso: 0xFE93, fin: 0xFE94, ini: null, med: null, jp: true, jn: false },
  0x062A: { iso: 0xFE95, fin: 0xFE96, ini: 0xFE97, med: 0xFE98, jp: true, jn: true },
  0x062B: { iso: 0xFE99, fin: 0xFE9A, ini: 0xFE9B, med: 0xFE9C, jp: true, jn: true },
  0x062C: { iso: 0xFE9D, fin: 0xFE9E, ini: 0xFE9F, med: 0xFEA0, jp: true, jn: true },
  0x062D: { iso: 0xFEA1, fin: 0xFEA2, ini: 0xFEA3, med: 0xFEA4, jp: true, jn: true },
  0x062E: { iso: 0xFEA5, fin: 0xFEA6, ini: 0xFEA7, med: 0xFEA8, jp: true, jn: true },
  0x062F: { iso: 0xFEA9, fin: 0xFEAA, ini: null, med: null, jp: true, jn: false },
  0x0630: { iso: 0xFEAB, fin: 0xFEAC, ini: null, med: null, jp: true, jn: false },
  0x0631: { iso: 0xFEAD, fin: 0xFEAE, ini: null, med: null, jp: true, jn: false },
  0x0632: { iso: 0xFEAF, fin: 0xFEB0, ini: null, med: null, jp: true, jn: false },
  0x0633: { iso: 0xFEB1, fin: 0xFEB2, ini: 0xFEB3, med: 0xFEB4, jp: true, jn: true },
  0x0634: { iso: 0xFEB5, fin: 0xFEB6, ini: 0xFEB7, med: 0xFEB8, jp: true, jn: true },
  0x0635: { iso: 0xFEB9, fin: 0xFEBA, ini: 0xFEBB, med: 0xFEBC, jp: true, jn: true },
  0x0636: { iso: 0xFEBD, fin: 0xFEBE, ini: 0xFEBF, med: 0xFEC0, jp: true, jn: true },
  0x0637: { iso: 0xFEC1, fin: 0xFEC2, ini: 0xFEC3, med: 0xFEC4, jp: true, jn: true },
  0x0638: { iso: 0xFEC5, fin: 0xFEC6, ini: 0xFEC7, med: 0xFEC8, jp: true, jn: true },
  0x0639: { iso: 0xFEC9, fin: 0xFECA, ini: 0xFECB, med: 0xFECC, jp: true, jn: true },
  0x063A: { iso: 0xFECD, fin: 0xFECE, ini: 0xFECF, med: 0xFED0, jp: true, jn: true },
  0x0640: { iso: 0x0640, fin: 0x0640, ini: 0x0640, med: 0x0640, jp: true, jn: true },
  0x0641: { iso: 0xFED1, fin: 0xFED2, ini: 0xFED3, med: 0xFED4, jp: true, jn: true },
  0x0642: { iso: 0xFED5, fin: 0xFED6, ini: 0xFED7, med: 0xFED8, jp: true, jn: true },
  0x0643: { iso: 0xFED9, fin: 0xFEDA, ini: 0xFEDB, med: 0xFEDC, jp: true, jn: true },
  0x0644: { iso: 0xFEDD, fin: 0xFEDE, ini: 0xFEDF, med: 0xFEE0, jp: true, jn: true },
  0x0645: { iso: 0xFEE1, fin: 0xFEE2, ini: 0xFEE3, med: 0xFEE4, jp: true, jn: true },
  0x0646: { iso: 0xFEE5, fin: 0xFEE6, ini: 0xFEE7, med: 0xFEE8, jp: true, jn: true },
  0x0647: { iso: 0xFEE9, fin: 0xFEEA, ini: 0xFEEB, med: 0xFEEC, jp: true, jn: true },
  0x0648: { iso: 0xFEED, fin: 0xFEEE, ini: null, med: null, jp: true, jn: false },
  0x0649: { iso: 0xFEEF, fin: 0xFEF0, ini: null, med: null, jp: true, jn: false },
  0x064A: { iso: 0xFEF1, fin: 0xFEF2, ini: 0xFEF3, med: 0xFEF4, jp: true, jn: true },

  0x067E: { iso: 0xFB56, fin: 0xFB57, ini: 0xFB58, med: 0xFB59, jp: true, jn: true },
  0x0686: { iso: 0xFB7A, fin: 0xFB7B, ini: 0xFB7C, med: 0xFB7D, jp: true, jn: true },
  0x0698: { iso: 0xFB8A, fin: 0xFB8B, ini: null, med: null, jp: true, jn: false },
  0x06A9: { iso: 0xFB8E, fin: 0xFB8F, ini: 0xFB90, med: 0xFB91, jp: true, jn: true },
  0x06AF: { iso: 0xFB92, fin: 0xFB93, ini: 0xFB94, med: 0xFB95, jp: true, jn: true },
  0x06CC: { iso: 0xFBFC, fin: 0xFBFD, ini: 0xFBFE, med: 0xFBFF, jp: true, jn: true },
  0x0679: { iso: 0xFB66, fin: 0xFB67, ini: 0xFB68, med: 0xFB69, jp: true, jn: true },
  0x0688: { iso: 0xFB88, fin: 0xFB89, ini: null, med: null, jp: true, jn: false },
  0x0691: { iso: 0xFB8C, fin: 0xFB8D, ini: null, med: null, jp: true, jn: false },
  0x06BA: { iso: 0xFB9E, fin: 0xFB9F, ini: null, med: null, jp: true, jn: false },
  0x06C1: { iso: 0xFBA6, fin: 0xFBA7, ini: 0xFBA8, med: 0xFBA9, jp: true, jn: true },
  0x06C2: { iso: 0xFBAA, fin: 0xFBAB, ini: null, med: null, jp: true, jn: false },
  0x06BE: { iso: 0xFBAC, fin: 0xFBAD, ini: 0xFBAE, med: 0xFBAF, jp: true, jn: true }
};

const LamAlef = {
  0x0622: { iso: 0xFEF5, fin: 0xFEF6 },
  0x0623: { iso: 0xFEF7, fin: 0xFEF8 },
  0x0625: { iso: 0xFEF9, fin: 0xFEFA },
  0x0627: { iso: 0xFEFB, fin: 0xFEFC }
};

function isArabicLetter(code) { return !!Letters[code]; }

const MIRROR = {
  '(': ')', ')': '(',
  '[': ']', ']': '[',
  '{': '}', '}': '{',
  '<': '>', '>': '<',
  '«': '»', '»': '«',
  '‹': '›', '›': '‹'
};
const OPEN_BR = new Set(['(', '[', '{', '<', '«', '‹']);
const CLOSE_BR = new Set([')', ']', '}', '>', '»', '›']);

function isSingleBracketUnit(u) {
  return u && u.value && u.value.length === 1 &&
    (OPEN_BR.has(u.value) || CLOSE_BR.has(u.value));
}

function isArabicPresentation(code) {
  return (
    (code >= 0xFE70 && code <= 0xFEFF) ||
    (code >= 0xFB50 && code <= 0xFDFF) ||
    code === 0x0640
  );
}

function isLTRChar(code) {
  const chr = String.fromCodePoint(code);
  return (
    (code >= 0x0041 && code <= 0x005A) ||
    (code >= 0x0061 && code <= 0x007A) ||
    (code >= 0x0030 && code <= 0x0039) ||
    (code >= 0x0660 && code <= 0x0669) ||
    (code >= 0x06F0 && code <= 0x06F9) ||
    "-−_=+/*\\|:.,;@#%^&!?~`'\"$€£¥©®™§¶º°‰±×÷‒–—…<>[](){}"
      .includes(chr) ||
    code === 0x066A ||
    code === 0x066B ||
    code === 0x066C
  );
}

function findPrevLetter(chars, i) {
  for (let k = i; k >= 0; k--) {
    const c = cp(chars[k]);
    if (c === CP_ZWJ) continue;
    if (isCombiningMark(c)) continue;
    if (c === CP_ZWNJ) return -1;
    return isArabicLetter(c) ? k : -1;
  }
  return -1;
}
function findNextLetter(chars, i) {
  for (let k = i; k < chars.length; k++) {
    const c = cp(chars[k]);
    if (c === CP_ZWJ) continue;
    if (isCombiningMark(c)) continue;
    if (c === CP_ZWNJ) return -1;
    return isArabicLetter(c) ? k : -1;
  }
  return -1;
}

function shapeArabic(input) {
  const chars = Array.from(input);
  const out = [];

  for (let i = 0; i < chars.length; i++) {
    const cur = chars[i];
    const curCp = cp(cur);

    // Lam + Alef ligature
    if (curCp === 0x0644) {
      let j = i + 1;
      let betweenMarks = '';
      while (j < chars.length && isCombiningMark(cp(chars[j]))) {
        betweenMarks += chars[j];
        j++;
      }
      if (j < chars.length && cp(chars[j]) !== CP_ZWNJ) {
        const nextCp = cp(chars[j]);
        if (LamAlef[nextCp]) {
          const pIdx = findPrevLetter(chars, i - 1);
          const prevCp = pIdx >= 0 ? cp(chars[pIdx]) : null;

          const connectPrev =
            prevCp && Letters[prevCp]?.jn && Letters[0x0644]?.jp;

          const ligGlyph = LamAlef[nextCp][connectPrev ? 'fin' : 'iso'];
          out.push(ch(ligGlyph));
          if (betweenMarks) out[out.length - 1] += betweenMarks;
          i = j;
          continue;
        }
      }
    }

    if (!isArabicLetter(curCp)) {
      out.push(cur);
      continue;
    }

    const prevIdx = findPrevLetter(chars, i - 1);
    const nextIdx = findNextLetter(chars, i + 1);

    const prevCp = prevIdx >= 0 ? cp(chars[prevIdx]) : null;
    const nextCp = nextIdx >= 0 ? cp(chars[nextIdx]) : null;

    const connectPrev = prevCp && Letters[prevCp]?.jn && Letters[curCp]?.jp;
    const connectNext = nextCp && Letters[curCp]?.jn && Letters[nextCp]?.jp;

    let form;
    if (connectPrev && connectNext && Letters[curCp].med) form = Letters[curCp].med;
    else if (connectPrev && Letters[curCp].fin) form = Letters[curCp].fin;
    else if (connectNext && Letters[curCp].ini) form = Letters[curCp].ini;
    else form = Letters[curCp].iso;

    out.push(ch(form));
  }

  return out.join('');
}

function convertDigits(input, target = 'keep') {
  if (target === 'keep') return input;
  const sets = {
    en: 0x0030,
    ar: 0x0660,
    fa: 0x06F0
  };
  const zeros = [0x0030, 0x0660, 0x06F0];
  const toZero = sets[target] ?? 0x0030;
  return Array.from(input).map(c => {
    const code = cp(c);
    for (const z of zeros) {
      if (code >= z && code <= z + 9) {
        return ch(toZero + (code - z));
      }
    }
    return c;
  }).join('');
}

function normalizePunctuation(input, mode = 'auto') {
  if (mode === 'keep') return input;

  const map = {
    ',': '،',
    ';': '؛',
    '?': '؟',
    '%': '٪'
  };

  const chars = Array.from(input);
  const out = [];
  const isASCIIPunct = c => map[c] !== undefined;

  function prevArabic(i) {
    for (let k = i - 1; k >= 0; k--) {
      const c = chars[k];
      const code = cp(c);
      if (isWhitespace(code)) continue;
      return isArabicLetter(code);
    }
    return false;
  }
  function nextArabic(i) {
    for (let k = i + 1; k < chars.length; k++) {
      const c = chars[k];
      const code = cp(c);
      if (isWhitespace(code)) continue;
      return isArabicLetter(code);
    }
    return false;
  }

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (!isASCIIPunct(c)) { out.push(c); continue; }

    if (mode === 'ar') { out.push(map[c]); continue; }

    if (prevArabic(i) || nextArabic(i)) out.push(map[c]);
    else out.push(c);
  }

  return out.join('');
}

function stripJoiners(str) {
  return Array.from(str).filter(c => {
    const code = cp(c);
    return code !== CP_ZWNJ && code !== CP_ZWJ;
  }).join('');
}

function mergeLTRWithInnerSpaces(units) {
  const out = [];
  for (let i = 0; i < units.length; ) {
    if (units[i].type === 'L') {
      let buf = units[i].value;
      let j = i + 1;
      while (j + 1 < units.length && units[j].type === 'W' && units[j + 1].type === 'L') {
        buf += units[j].value + units[j + 1].value;
        j += 2;
      }
      out.push({ type: 'L', value: buf });
      i = j;
    } else {
      out.push(units[i]);
      i++;
    }
  }
  return out;
}

function mirrorBracketsByPair(units, mode = 'auto') {
  if (mode === 'off') return units;
  const stack = [];
  const toMirror = new Set();

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!isSingleBracketUnit(u)) continue;
    const c = u.value;

    if (OPEN_BR.has(c)) {
      stack.push({ char: c, idx: i });
    } else if (CLOSE_BR.has(c)) {
      const needOpen = MIRROR[c];
      let pos = -1;
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s].char === needOpen) { pos = s; break; }
      }
      if (pos !== -1) {
        const opener = stack.splice(pos, 1)[0];
        let hasArabicInside = false;
        for (let k = opener.idx + 1; k < i; k++) {
          if (units[k].type === 'A') { hasArabicInside = true; break; }
        }
        if (mode === 'always' || (mode === 'auto' && hasArabicInside)) {
          toMirror.add(opener.idx);
          toMirror.add(i);
        }
      }
    }
  }

  if (toMirror.size) {
    for (const idx of toMirror) {
      const c = units[idx].value;
      const m = MIRROR[c];
      if (m) units[idx] = { ...units[idx], value: m };
    }
  }
  return units;
}

function isPunctOnlyLTR(str) {
  for (const c of Array.from(str)) {
    const code = cp(c);
    if (!isLTRChar(code)) return false;
    if (
      (code >= 0x0030 && code <= 0x0039) ||
      (code >= 0x0041 && code <= 0x005A) ||
      (code >= 0x0061 && code <= 0x007A) ||
      (code >= 0x0660 && code <= 0x0669) ||
      (code >= 0x06F0 && code <= 0x06F9)
    ) return false;
  }
  return true;
}

function clusterLTRBracketGroups(units) {
  const out = [];
  for (let i = 0; i < units.length; ) {
    const u = units[i];

    if (isSingleBracketUnit(u) && OPEN_BR.has(u.value)) {
      let depth = 1;
      let j = i + 1;
      for (; j < units.length; j++) {
        const v = units[j];
        if (isSingleBracketUnit(v)) {
          if (OPEN_BR.has(v.value)) depth++;
          else if (CLOSE_BR.has(v.value)) depth--;
          if (depth === 0) break;
        }
      }

      if (j < units.length && depth === 0) {
        let insideOnlyLW = true;
        let hasL = false;
        for (let k = i + 1; k < j; k++) {
          const t = units[k].type;
          if (t === 'L') hasL = true;
          if (t !== 'L' && t !== 'W') { insideOnlyLW = false; break; }
        }
        if (insideOnlyLW && hasL) {
          let buf = '';
          for (let k = i; k <= j; k++) buf += units[k].value;

          let k = j + 1;
          while (k < units.length) {
            if (units[k].type === 'W') {
              buf += units[k].value; k++; continue;
            }
            if (units[k].type === 'L' && isPunctOnlyLTR(units[k].value)) {
              buf += units[k].value; k++; continue;
            }
            break;
          }

          out.push({ type: 'L', value: buf });
          i = k;
          continue;
        }
      }
    }

    out.push(u);
    i++;
  }
  return out;
}

function reverseSegment(segment, bracketMode = 'auto') {
  const chars = Array.from(segment);
  let units = [];

  for (let i = 0; i < chars.length; ) {
    const code = cp(chars[i]);

    if (isCombiningMark(code)) {
      if (units.length) units[units.length - 1].value += chars[i];
      else units.push({ type: 'N', value: chars[i] });
      i++;
      continue;
    }

    if (isArabicPresentation(code)) {
      let block = chars[i];
      let j = i + 1;
      while (j < chars.length && isCombiningMark(cp(chars[j]))) {
        block += chars[j];
        j++;
      }
      units.push({ type: 'A', value: block });
      i = j;
      continue;
    }

    if (isLTRChar(code)) {
      let run = chars[i];
      let j = i + 1;
      while (j < chars.length && isLTRChar(cp(chars[j]))) {
        run += chars[j];
        j++;
      }
      units.push({ type: 'L', value: run });
      i = j;
      continue;
    }

    if (isWhitespace(code)) {
      let ws = chars[i];
      let j = i + 1;
      while (j < chars.length && isWhitespace(cp(chars[j]))) {
        ws += chars[j];
        j++;
      }
      units.push({ type: 'W', value: ws });
      i = j;
      continue;
    }

    units.push({ type: 'N', value: chars[i] });
    i++;
  }

  units = mergeLTRWithInnerSpaces(units);

  units = mirrorBracketsByPair(units, bracketMode);

  units = clusterLTRBracketGroups(units);

  units.reverse();

  return units.map(u => u.value).join('');
}

function reverseForMinecraft(shaped, { brackets = 'auto' } = {}) {
  let res = '';
  let buf = '';

  for (let i = 0; i < shaped.length; ) {
    const c = shaped[i];

    if (c === '\r' || c === '\n') {
      if (buf) {
        res += reverseSegment(buf, brackets);
        buf = '';
      }
      if (c === '\r' && i + 1 < shaped.length && shaped[i + 1] === '\n') {
        res += '\r\n';
        i += 2;
      } else {
        res += c;
        i += 1;
      }
      continue;
    }

    buf += c;
    i += 1;
  }
  if (buf) res += reverseSegment(buf, brackets);

  return res;
}

function arabicFormulation(input, options = {}) {
  const withDigits = convertDigits(input, options.digits || 'keep');
  const withPunct = normalizePunctuation(withDigits, options.punctuation || 'auto');
  const shaped = shapeArabic(withPunct);
  const shapedNoJoiners = stripJoiners(shaped);
  const visual = reverseForMinecraft(shapedNoJoiners, { brackets: options.brackets || 'auto' });
  return visual;
}

export {
  arabicFormulation,
  shapeArabic,
  reverseForMinecraft,
  convertDigits
};

