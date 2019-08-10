function* addEndOf(iterable, end) {
  for (let element of iterable)
    yield element;
  yield end;
}
function* enumerate(iterable, start=0) {
  let idx = start;
  for (let element of iterable) {
    yield [idx, element];
    idx += 1;
  }
}

const SymbolTrie = new Map();

function SymbolTrieInsert(symbol, item) {
  let Trie = SymbolTrie;
  for (let char of symbol) {
    if (!Trie.has(char))
      Trie.set(char, new Map());
    Trie = Trie.get(char);
  }
  Trie.set('END', item);
}

function* textObjGen(charGen, mkTextObj) {
  let charList = [];
  let bList = [];  // [[start, alive, currEND, branch], ...]
  let yieldStartIdx = 0;
  
  charGen = addEndOf(charGen, '');
  for (let [charIdx, char] of enumerate(charGen)) {
    let yieldMode = false;
    charList.push(char);
    
    if (SymbolTrie.has(char))
      bList.push([charIdx, true, undefined, SymbolTrie]);
    for (let [bIdx, [start, alive, currEND, branch]] of enumerate(bList)) {
      if (!alive) continue;
      
      if (branch.has(char)) {
        bList[bIdx][3] = branch = branch.get(char);
        if (branch.has('END')) {
          bList[bIdx][2] = currEND = branch.get('END');
          bList.splice(bIdx + 1);
        }
      } else {
        bList[bIdx][1] = alive = false;
        if (bIdx === 0)
          yieldMode = true;
      }
    }
    
    while (yieldMode && bList.length) {
      let [start, alive, currEND, branch] = bList[0];
      if (alive) break;
      bList.shift();
      if (currEND === undefined) continue;
      let len = currEND.rawLength;
      let textList = charList.splice(0, start - yieldStartIdx);
      let symbolList = charList.splice(0, len);
      yieldStartIdx = start + len;
      if (textList.length)
        yield mkTextObj(textList.join(''));
      yield currEND;
    }
  }
  yield mkTextObj(charList.join(''));
}

