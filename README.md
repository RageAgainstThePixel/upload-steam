# upload-steam

A GitHub action for uploading an [app build](https://partner.steamgames.com/doc/sdk/uploading#4) or [workshop item](https://partner.steamgames.com/doc/features/workshop/implementation#SteamCmd) to Steam.

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.

## How to use

This action assumes some secrets to be set in your repository

* `STEAM_USERNAME`: The username of your steamworks build account
* `STEAM_PASSWORD`: The password for the account
* `STEAM_SHARED_SECRET`: Optional, a Steam Guard shared secret ([setup steps](#setup-shared-secrets))
* `STEAM_CONFIG`: Optional, a steam account config.vdf encoded as base64 string ([setup steps](#setup-config))

### outputs

* `manifest`: The path to the resulting build manifest.

### workflow

```yaml
steps:
    # sets up the steamcmd command alias
  - uses: RageAgainstThePixel/setup-steamcmd@v1
    # uploads a build or workshop item to steam
  - uses: RageAgainstThePixel/upload-steam@v1
    id: upload
    with:
      username: ${{ secrets.STEAM_USERNAME }}
      password: ${{ secrets.STEAM_PASSWORD }}
      shared_secret: ${{ secrets.STEAM_SHARED_SECRET }}
```

### inputs

| Name | Description | Required |
| ---- | ----------- | -------- |
| `username` | A Steamworks [build account](https://partner.steamgames.com/doc/sdk/uploading#Build_Account) name with the "Edit App Metadata" and "Publish App Changes To Steam" permissions granted. | true |
| `password` | The password for the account. | if `config` is not provided. |
| `totp` | A temporary one time pass code (totp) from Steam Guard. | if `shared_secret` and `config` are not provided |
| `shared_secret` |  The [shared secret](#shared-secret) from Steam Guard's two-factor authentication. | if `totp` and `config` are not provided. |
| `config` | Steam [config.vdf](#config) encoded as base64 string. | if `password`, `totp` and `shared_secret` are not provided. |
| `app_id` | The app id of the game. | if `app_build` or `workshop_item` are not provided. |
| `workshop_item_id` | The `publishedfileid`. To create a new item `app_id` must be set and `workshop_item_id` be set to 0. To update an existing item, both `app_id` and `workshop_item_id` must be set. | for workshop item uploads and if `workshop_item` is not provided. |
| `description` | Either the build description or workshop item description. If an `app_build` or `workshop_item` file is provided, this will be ignored. | false |
| `content_root` | The root folder of your game files or workshop item files, can be an absolute or relative path. If an `app_build` or `workshop_item` file is provided, this will be ignored. Defaults to `github.workspace`. | false |
| `set_live` | Beta branch name to automatically set live after successful build, none if empty. Note that the default branch can not be set live automatically. That must be done through the App Admin panel. If an `app_build` file is provided, this will be ignored. | false |
| `depot_file_exclusions` | A list of paths to exclude from the depot that will excluded mapped files again and can also contain wildcards like `?` or `*`. If `app_build` or `depots` are provided, this will be ignored. | false |
| `install_scripts` | The path(s) to a predefined install_script.vdf file(s). If `app_build` or `depots` are provided, this will be ignored. | false |
| `depots` | The path(s) to a predefined depot_build.vdf file(s). If an `app_build` file is provided, this will be ignored. Overrides `install_scripts` and `depot_file_exclusions`. | false |
| `app_build` | The path to a predefined app_build.vdf file. Overrides all other set options. | false |
| `workshop_item` | 'Optional, The path to a predefined workshop_item.vdf file. Overrides all other set options. | false |

## Multi-Factor Authentication Setup

Deploying to Steam requires using Multi-Factor Authentication (MFA).
This action requires at least one of these authentication methods are set:

* `totp`: A temporary one time pass code from Steam Guard Authenticator app.
* `shared_secret`: The [shared secret](#shared-secret) from Steam Guard's two-factor authentication.
* `config`: Steam [config.vdf](#config) encoded as base64 string.

### Temporary One Time Pass Code

Can be obtained from Steam Guard Authenticator app. Usually is temporary and resets after a set amount of time.

### Shared Secret

> ![WARNING]
> Obtaining a shared secret from the Steam Guard Authenticator app is challenging and complicated.
> It is recommended to use the [config](#config) setup.
> This shared secret should not be checked into source control or shared with anyone!

> ![IMPORTANT]
> If you've already got SteamGuard setup for your account and you remove it, you'll have to wait 3 days before being able to publish a live build.

* Detailed instructions can be found [here](https://gist.github.com/mathielo/8367e464baa73941a075bae4dd5eed90)

### Config

To setup steamcmd for continuous integration, or just on a machine or VM that will get re-imaged frequently, you'll need to include the config file that contains your login token. Follow these steps so that your initial login token is properly saved:

* Download [steamworks sdk](https://partner.steamgames.com/doc/gettingstarted)
* Unzip steamworks in your desired location
* Open in explorer or finder
* Navigate to `sdk/tools/ContentBuilder/builder` (or osx/linux if on non-windows)
* Copy the path to the steamcmd executable (`steamcmd.exe` for windows, `steamcmd.sh` for osx/linux)
* In a new terminal run `<sdk>/steamcmd.exe +login <username>`
* Enter your `password`, and the Steam Guard totp
* Type `info`, and you should see your account listed as connected
* Type `quit`
* The folder where you ran `steamcmd` will now contain new content with config directory.
  * `<sdk>/config/config.vdf`
* Encode the file to base64 string
  * In a new bash terminal run `base64 <sdk>/config/config.vdf > encoded.txt`
* Copy the contents of the encoded text file and paste it in `STEAM_CONFIG` secret in github actions.

> ![NOTE]
> If you change your account's security settings you'll need to follow these steps again.
