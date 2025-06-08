const express = require('express');
const router = express.Router();

module.exports = (processoModel) => {
  // GET - Listar todos os processos, com filtro opcional por molde
  router.get('/', async (req, res) => {
    try {
      const molde = req.query.molde || '';
      const processos = await processoModel.listarTodos(molde);
      res.json(processos);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      res.status(500).json({ error: 'Erro ao buscar processos.' });
    }
  });

  // POST - Inserir novo processo
  router.post('/', async (req, res) => {
    try {
      const {
        molde,
        referencia,
        programa_nc,
        dmg,
        maquina_600_ii,
        maquina_800_ii,
        maquina_600_i,
        maquina_800_i,
        ixion_ii,
        observacao
      } = req.body;

      if (!molde || !referencia) {
        return res.status(400).json({ error: 'Molde e referência são obrigatórios.' });
      }

      const novoProcesso = await processoModel.inserir({
        molde,
        referencia,
        programa_nc: !!programa_nc,
        dmg: !!dmg,
        maquina_600_ii: !!maquina_600_ii,
        maquina_800_ii: !!maquina_800_ii,
        maquina_600_i: !!maquina_600_i,
        maquina_800_i: !!maquina_800_i,
        ixion_ii: !!ixion_ii,
        observacao: observacao || ''
      });

      res.status(201).json(novoProcesso);
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      res.status(500).json({ error: 'Erro ao criar processo.' });
    }
  });

  // PUT - Atualizar um processo existente
  router.put('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const atualizado = await processoModel.atualizar(id, req.body);
      res.json(atualizado);
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      res.status(500).json({ error: 'Erro ao atualizar processo.' });
    }
  });

  // DELETE - Excluir processo
  router.delete('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      await processoModel.excluir(id);
      res.json({ message: 'Processo excluído com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
      res.status(500).json({ error: 'Erro ao excluir processo.' });
    }
  });

  return router;
};
