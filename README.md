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

In addition, this plugin is injecting policy requiring authenticated user to have authorization for role `admin` for accessing REST endpoint `/api/user`.

### Server-Side Session

The plugin is controlling information on authenticated user in current server-side session. 

When combined with hitchy-plugin session this results in exposing information on currently authenticated user and its authorization in headers of every response.

### Creating First Account

The endpoint `/api/auth/login` is always checking whether there is at least one user with role `admin` in current database. If there is no such user the controller is implicitly creating one with username `admin`, password `nimda` and role `admin`.

## Upcoming Revisions

### High Priority

* Add endpoint for changing current user's password.
* Add endpoint in scope of `/api/auth` for creating new user account.

### Medium Priority

* Add support for multiple roles per user.

### Last But Not Least

* Integrate [passport](http://www.passportjs.org/) or similar tool.
* Improve authorization system by adding additional level of customizable access control.

## Note

This plugin comes with a very limited set of supported features, currently. It is though intended to include additional features over time.
