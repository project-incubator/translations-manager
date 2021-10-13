export function unixPath(raw: string) {
  return raw.split('\\').join('/')
}

export function dir(path: string) {
  return removeTrailingSlash(path).split('/').slice(0, -1).join('/')
}

export function join(...paths: string[]) {
  return removeTrailingSlash(paths.join('/').replace(/\/\//g, '/'))
}

export function removeTrailingSlash(path: string) {
  return path.endsWith('/') ? path.slice(0, -1) : path
}
