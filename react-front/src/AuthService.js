import decode from 'jwt-decode';
/*
* https://hptechblogs.com/using-json-web-token-react/
*
*
*/

let _unauthCallback = () => {

  console.log("注意：setUnauthCallbackの内容がまだ設定されていない");
};

class AuthService {
  // Initializing important variables
  constructor(domain) {
    this.domain = domain || 'http://localhost:3000' // API server domain
    this.fetch = this.fetch.bind(this) // React binding stuff
    this.login = this.login.bind(this)
    this.getProfile = this.getProfile.bind(this)
    this.checkStatus = this.checkStatus.bind(this);
  }

  static setUnauthCallback(callback){
    _unauthCallback = callback;
  }


  login(username, password) {
    // Get a token from api server using the fetch api
    return this.fetch(`/users/signin`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password
      })
    }).then(res => {
      this.setToken(res.token) // Setting the token in localStorage
      return Promise.resolve(res);
    })
  }

  loggedIn() {
    // Checks if there is a saved token and it's still valid
    const token = this.getToken() // GEtting token from localstorage
    return !!token && !this.isTokenExpired(token) // handwaiving here
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) { // Checking if token is expired. N
        return true;
      }
      else
        return false;
    }
    catch (err) {
      return false;
    }
  }

  setToken(idToken) {
    // Saves user token to localStorage
    localStorage.setItem('id_token', idToken)
  }

  getToken() {
    // Retrieves the user token from localStorage
    return localStorage.getItem('id_token')
  }

  logout() {
    // Clear user token and profile data from localStorage
    localStorage.removeItem('id_token');
  }

  getProfile() {
    // Using jwt-decode npm package to decode the token
    return decode(this.getToken());
  }


  fetch(url, options) {
    // performs api calls sending the required authentication headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    // Setting Authorization header
    // Authorization: Bearer xxxxxxx.xxxxxxxx.xxxxxx
    if (this.loggedIn()) {
      headers['Authorization'] = this.getToken();
    }

    let data = {
      headers,
      ...options
    };
    return fetch(this.domain + url, data)
    .then(this.checkStatus.bind(this))
    .then(response => response? response.json() : null);
  }

  checkStatus(response) {

    if(response.status === 401){
      _unauthCallback();
      return;

    }

    // raises an error in case response status is not a success
    if (response.status >= 200 && response.status < 300) { // Success status lies between 200 to 300
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }
}

export default AuthService;
