import * as lancamentosModel from '../model/lancamentosModel.js';

const validId = (id) => /^\d{1,9}$/.test(String(id));
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const validAmount = (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) < 1e12;
const valid = (body = {}) => typeof body.descricao === 'string' && body.descricao.trim() && validAmount(body.valor) && ['entrada', 'saida'].includes(body.natureza) && validDate(body.data) && validId(body.contaId) && ['pago', 'pendente'].includes(body.status);

export const getAllLancamentos = async (_req, res, next) => {
  try {
    res.json(await lancamentosModel.getAllLancamentos());
  } catch (error) { next(error); }
};

export const getLancamentoByID = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    const lancamento = await lancamentosModel.getLancamentoByID(req.params.id);
    if (!lancamento) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    res.json(lancamento);
  } catch (error) { next(error); }
};

export const insertLancamento = async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados do lançamento inválidos.' });
    if (!(await lancamentosModel.isAccountActive(req.body.contaId))) return res.status(400).json({ message: 'Selecione uma conta ativa.' });
    res.status(201).json(await lancamentosModel.insertLancamento(req.body));
  } catch (error) { next(error); }
};

export const updateLancamento = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados do lançamento inválidos.' });
    if (!(await lancamentosModel.isAccountActive(req.body.contaId))) return res.status(400).json({ message: 'Selecione uma conta ativa.' });
    const lancamento = await lancamentosModel.updateLancamento(req.params.id, req.body);
    if (!lancamento) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    res.json(lancamento);
  } catch (error) { next(error); }
};

export const deleteLancamento = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
    const lancamento = await lancamentosModel.deleteLancamento(req.params.id);
    if (!lancamento) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    res.json({ message: 'Lançamento removido com sucesso.' });
  } catch (error) { next(error); }
};
