// Just a quick script to test URLSearchParams parsing logic
const hash = "#access_token=ey...&expires_in=3600&refresh_token=123&token_type=bearer&type=invite"
const params = new URLSearchParams(hash.substring(1));
console.log(params.get('access_token'))
console.log(params.get('refresh_token'))
