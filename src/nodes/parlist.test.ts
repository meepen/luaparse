import assert from 'node:assert';
import { ParameterList } from './parlist.js';
import { NameList } from './namelist.js';

describe('ParameterList', () => {
  const names = new NameList([]);
  const parlist = new ParameterList(names, false);
  it('should return the names', () => {
    assert.equal(parlist.namesList, names);
  });
});
