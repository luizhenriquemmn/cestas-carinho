# Cestas & Carinho Admin — Android

Aplicativo administrativo em Expo/React Native para pedidos, financeiro e produtos.

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave pública `anon` do mesmo projeto Supabase usado pelo site.
3. Em `EXPO_PUBLIC_API_URL`, use o IP local do computador que executa o Next.js. Em celular físico, `localhost` não funciona.

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.107:3000
```

## Desenvolvimento

Execute o servidor web na raiz do repositório:

```bash
npm run dev
```

Em outro terminal:

```bash
cd mobile
npm start
```

Instale o Expo Go no Android e leia o QR Code. Celular e computador devem estar na mesma rede.

## Build Android

Depois de configurar uma conta Expo/EAS:

```bash
npx eas-cli build --platform android --profile preview
```

O perfil `preview` gera um APK instalável para testes. Para publicar na Play Store, use o perfil `production`, que gera um Android App Bundle:

```bash
npx eas-cli build --platform android --profile production
```

O identificador Android é `com.cestasecarinho.admin`.
