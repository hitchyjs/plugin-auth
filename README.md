# hitchy-plugin-auth

## License

MIT

## Usage

When in root folder of a Hitchy-based application run this command:

```
npm i hitchy-plugin-auth hitchy-plugin-session hitchy-plugin-cookies hitchy-odem
```

It will install this plugin as well as its peer dependencies you are in charge of.

After restarting your application the plugin is discovered and injecting some policy routes used to detect current context of either request and to expose some additional information and API regarding user authentication and authorization.

### REST-API

The plugin injects special endpoints for managing a user's authentication.

| endpoint | method | description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Takes username and password in request body and uses them for authenticating selected user. |
| `/api/auth/logout` | GET | Drops information on previously authenticated user. |
| `/api/auth/check` | GET | Fetches status information on currently authenticated user. |

### Server-Side Session

The plugin is controlling information on authenticated user in current server-side session. 

When combined with hitchy-plugin session this results in exposing information on currently authenticated user and its authorization in headers of every response.

## Note

This plugin comes with a very limited set of supported features, currently. It is though intended to include additional features over time.
