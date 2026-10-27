# Domaine XXV — Atelier de materiais

Configurador de materiais para a cozinha e a casa de banho comum do 1.º andar da moradia Domaine XXV, em Oliveirinha, Aveiro.

Aplicação Next.js com panoramas 360° em ecrã completo, adaptada a computador, iPad e telemóvel. Permite escolher três ambientes ou combinar acabamentos por elemento, consultar as fichas dos materiais e guardar propostas.

## Desenvolvimento

Requer Node.js 20.9 ou superior.

```sh
npm ci
npm run dev
```

Pré-visualização em `http://127.0.0.1:8791`.

```sh
npm run build
npm start
```

O build gera a versão estática em `out/`. `npm start` serve essa versão localmente; pode definir `PORT` para usar outra porta.

## Publicação no Vercel

Importar este repositório com a framework **Next.js**, diretório raiz `./`, instalação `npm ci` e build `npm run build`. As definições estão em `vercel.json`. Não são necessárias variáveis de ambiente, base de dados ou chaves de API.

A integração GitHub/Vercel publica as alterações da branch `main`. Não enviar `node_modules`, `out`, `.next`, ficheiros `.env` ou pastas locais de trabalho para o repositório.

## Funcionalidades

- Cozinha e casa de banho com escolhas independentes.
- Ambientes Areia Natural, Grafite & Carvalho e Luz & Contraste.
- Escolha de acabamentos para frentes, bancada, placa entre móveis, pavimento e puxadores da cozinha; paredes, duche e pavimento da casa de banho.
- Ambas as divisões abrem no zoom mínimo. A cozinha aproxima ao editar; a casa de banho mantém o zoom mínimo e a direção da câmara.
- Sessão atual conservada no separador; propostas guardadas no navegador.
- Exportação de sessão JSON, imagem JPEG, panorama 360° e apresentação HTML autónoma com as duas divisões.

As propostas guardadas localmente não são sincronizadas entre dispositivos ou domínios. Para transferir uma proposta, exportar e importar a sessão JSON. A apresentação HTML pode ser enviada ao cliente e aberta sem instalar uma aplicação.

## Estrutura

- `app/`: páginas, metadados e estilos responsivos.
- `components/Atelier.jsx`: interface React e gestão das escolhas.
- `lib/`: visualizador WebGL, geometria, catálogo, sessões e exportação.
- `public/assets/`: panoramas aprovados, detalhes e amostras dos materiais.
- `scripts/prepare-viewer.mjs`: prepara o visualizador usado nas apresentações exportadas; executado automaticamente antes do desenvolvimento e build.

## Materiais e imagens

O catálogo baseia-se no dossier Domaine XXV de três kits de materiais. A imagem é uma simulação: cores, texturas, juntas e acessórios devem ser confirmados com as amostras físicas, fichas dos fabricantes e projeto.

Os panoramas WebP são preservados na resolução original. Os detalhes aprovados da cozinha corrigem o pavimento, puxadores, placa contínua entre móveis e acessórios. Apenas os recursos da divisão selecionada são carregados; os da outra divisão são obtidos ao navegar para ela.
