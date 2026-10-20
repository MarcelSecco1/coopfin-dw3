import * as contasModel from '../model/contasModel.js';

const types = new Set(['corrente', 'poupanca', 'caixa', 'investimento']);
const validId = (id) => /^\d{1,9}$/.test(String(id));
const validAmount = (value) => Number.isFinite(Number(value)) && Math.abs(Number(value)) < 1e12;
const valid = (body = {}) => typeof body.nome === 'string' && body.nome.trim() && types.has(body.tipo) && (body.instituicao == null || typeof body.instituicao === 'string') && validAmount(body.saldoInicial ?? 0);

export const getAllContas = async (_req, res, next) => {
  try {
    res.json(await contasModel.getAllContas());
  } catch (error) { next(error); }
};

export const getContaByID = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    const conta = await contasModel.getContaByID(req.params.id);
    if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json(conta);
  } catch (error) { next(error); }
};

export const insertConta = async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados da conta inválidos.' });
    res.status(201).json(await contasModel.insertConta(req.body));
  } catch (error) { next(error); }
};

export const updateConta = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados da conta inválidos.' });
    const conta = await contasModel.updateConta(req.params.id, req.body);
    if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json(conta);
  } catch (error) { next(error); }
};

export const deleteConta = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    const conta = await contasModel.deleteConta(req.params.id);
    if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json({ message: 'Conta removida com sucesso.' });
  } catch (error) { next(error); }
};
