# Fotos do quarto — Design

**Spec**: `.specs/features/fotos-do-quarto/spec.md`  
**Status**: Implemented

A foto do quarto repete a foto do hotel: presign no S3, registro da URL, uma capa, toast na extranet. O teto é 8. Apagar o quarto, ação que já existe, apaga as fotos no banco por cascata.

## Modelo

`RoomImage` em `room_images`, com `roomTypeId`, `url`, `sortOrder`, `isPrimary`, `altText`. Some quando o quarto some.

A chave no storage é `hotels/{hotelId}/rooms/{roomId}/{uuid}.ext`. A URL registrada precisa conter esse trecho.

## API

`RoomImagesController` em `/extranet/hotels/:hotelId/rooms/:roomId/images`.

- `GET` lista com a capa primeiro
- `POST presign` e `POST` recusam a 9ª com 422 e "Este quarto já tem 8 fotos."
- `PATCH :imageId/primary` deixa uma única capa
- `DELETE :imageId` promove a próxima capa

Só rascunho e rejeitado aceitam mudança. Quarto de outro hotel responde 404.

`POST /extranet/hotels/:id/submit`, depois das regras atuais, responde 422 "Cadastre ao menos 1 foto em: {nomes}" e não muda o status. O detalhe do hotel devolve `roomsMissingPhotoNames`. A lista de quartos devolve `coverImageUrl`.

O dossiê do admin inclui `roomTypes[].images`, capa primeiro.

## Telas

- Criar quarto: `RoomPhotoPicker` dentro do formulário. O quarto nasce, as fotos sobem, a primeira vira capa, e a edição abre.
- Editar quarto: `RoomPhotoGallery` com enviar, definir capa e excluir.
- Lista: capa 64px, ou o ícone de prédio.
- Checklist: passo "Foto em cada quarto".
- Admin: miniaturas no card do quarto, sem botão. Falha de carga usa o ícone de prédio.
