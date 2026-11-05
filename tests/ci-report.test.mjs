import test from "node:test";
import assert from "node:assert/strict";
import { parseJunitSummary } from "./helpers/junit-summary.mjs";

test("relatório JUnit resume a suíte sem confundir cobertura com testes aprovados", () => {
  const summary = parseJunitSummary('<testsuites><testcase name="passou"/><testcase name="ignorado"><skipped/></testcase></testsuites>');
  assert.equal(summary.testCount, 2);
  assert.equal(summary.skippedCount, 1);
  assert.deepEqual(summary.failures, []);
});

test("relatório JUnit preserva nome, arquivo, mensagem e detalhe de falha", () => {
  const xml = '<testsuites><testcase name="validação &amp; limites" file="tests/one.mjs"><failure message="esperado &amp;quot;x&amp;quot;">AssertionError: ruim&#10;  at tests/one.mjs:4</failure></testcase></testsuites>';
  const summary = parseJunitSummary(xml);
  assert.equal(summary.testCount, 1);
  assert.equal(summary.failures[0].name, 'validação & limites');
  assert.equal(summary.failures[0].file, "tests/one.mjs");
  assert.equal(summary.failures[0].message, 'esperado "x"');
  assert.match(summary.failures[0].detail, /AssertionError: ruim/);
});
