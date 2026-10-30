import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreSkills,canTransition} from '../server/domain.js';
test('matching uses all requirements in denominator and respects proficiency',()=>{const requirements=[{skill_id:1,importance:'critical',min_level:2},{skill_id:2,importance:'required',min_level:2},{skill_id:3,importance:'preferred',min_level:1}];assert.equal(scoreSkills(requirements,new Map([[1,2],[2,1],[3,1]])),67);assert.equal(scoreSkills(requirements,new Map()),0);});
test('no requirements means no score',()=>assert.equal(scoreSkills([],new Map()),null));
test('workflow rejects reopening final decisions and skipping shortlist',()=>{assert.equal(canTransition('applied','selected'),false);assert.equal(canTransition('selected','applied'),false);assert.equal(canTransition('applied','shortlisted'),true);assert.equal(canTransition('shortlisted','withdrawn'),true);});
