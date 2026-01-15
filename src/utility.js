export function setCookie(name, value, expired) {
  // const date = new Date();
  // date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  // const expires = `expires=${date.toUTCString()}`;
  const expires = `expires=${new Date(expired)}`;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; ${expires}; path=${"/"}`;
}

export function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0)
      return decodeURIComponent(c.substring(nameEQ.length));
  }
  return null;
}

export function deleteCookie(name, path = "/") {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}
