# Fotos do quarto — Context

**Gathered:** 2026-10-25  
**Spec:** `.specs/features/fotos-do-quarto/spec.md`  
**Status:** Ready for design

---

## Feature Boundary

O parceiro anexa até 8 fotos na ficha de um quarto já criado. Uma delas é a capa. O hotel só vai para revisão quando cada quarto tem ao menos uma. O admin vê essa galeria no dossiê e não a edita. O hóspede não entra nesta entrega.

---

## Implementation Decisions

### Limite

- 8 fotos por quarto.
- JPG, PNG ou WebP, até 5 MB, iguais à foto do hotel.
- A 9ª é recusada na tela e de novo na API, com "Este quarto já tem 8 fotos."

### Capa

- A primeira foto enviada vira a capa, com o toast "Foto principal enviada" / "Ela já é a capa do quarto."
- O parceiro marca outra como capa.
- Excluir a capa promove a próxima. Excluir a última deixa o quarto sem foto.

### Onde o parceiro mexe

- Criar e editar usam a mesma galeria.
- Em "Adicionar", o parceiro escolhe de 1 a 8 arquivos junto com os dados. Ao salvar, o quarto nasce, as fotos sobem, a primeira vira capa, o toast é "Quarto criado" e a edição abre com elas na tela.
- Mais de 8 arquivos no criar recusa antes de gravar o quarto: "Escolha no máximo 8 fotos."
- Se o quarto nasce e uma foto falha, o quarto fica e a edição mostra só o que entrou, com "Foto não enviada".
- Na edição, as fotos já salvas aparecem com a capa primeiro. Enviar, definir capa e excluir ficam nessa tela.
- Salvar nome, ocupação ou comodidades mantém as fotos e mostra "Quarto salvo".
- A lista de quartos mostra a capa, ou o ícone de prédio quando não há foto.
- Excluir o quarto inteiro continua fora: a extranet não tem essa ação.
- Toasts: "Foto enviada", "Foto não enviada", "Foto principal definida", "Foto excluída".
- Excluir pede "Excluir esta foto?" e cancelar não apaga.
- Hotel em revisão, ativo ou suspenso não aceita envio, troca de capa nem exclusão.

### Revisão

- Mensagem 422: "Cadastre ao menos 1 foto em: {nomes}", nomes na ordem de cadastro, separados por vírgula e espaço.
- O status não muda.
- O checklist ganha o passo "Foto em cada quarto".

### Admin

- Galeria dentro do card de cada quarto, capa primeiro.
- Foto que falha, ou quarto sem foto, mostra o ícone de prédio e nenhum texto.
- Nenhum botão de enviar, capa ou excluir.

### Agent's Discretion

- Nome das rotas e da tabela, desde que a foto pertença ao quarto e suma com ele.
- O selo visual de capa, desde que o texto deixe claro qual é a principal.

### Declined / Undiscussed Gray Areas → Assumptions

Nenhuma área ficou sem dono. As decisões acima cobrem limite, capa, lugar do envio, feedback, revisão e admin.

---

## Specific References

- Galeria, toasts e placeholder da foto do hotel em `apps/extranet/src/components/photos/photo-gallery.tsx` e no dossiê do admin.
- O usuário pediu o mesmo tipo de feedback: sucesso, erro e o limite.

---

## Deferred Ideas

- Teto de quantidade para as fotos do hotel.
- Reordenar fotos arrastando.
- Mostrar as fotos do quarto para o hóspede.
