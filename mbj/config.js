module.exports = {
    development: {
        passport: {
            strategy: 'saml',
            saml: {
                protocol: 'https://',
                host: 'evaluation.qlik.com',
                path: 'https://evaluation.qlik.com/api/login/acs',                
                entryPoint: 'https://qlikid-dev.qlik.com/portal/evaluation',
                logoutUrl: 'https://qlikid-dev.qlik.com/logout?sp=evaluation',
                logoutCallbackUrl: 'https://evaluation.qlik.com/api/logout/acs',
                issuer: 'www.idp.com',
                cert: "MIIDbzCCAlegAwIBAgIEGzq3PTANBgkqhkiG9w0BAQsFADBoMQswCQYDVQQGEwJHQjEQMA4GA1UECBMHVW5rbm93bjEQMA4GA1UEBxMHVW5rbm93bjENMAsGA1UEChMEUWxpazEQMA4GA1UECxMHVW5rbm93bjEUMBIGA1UEAxMLd3d3LmlkcC5jb20wHhcNMTcwODA0MDkxMDA4WhcNMjcwODAyMDkxMDA4WjBoMQswCQYDVQQGEwJHQjEQMA4GA1UECBMHVW5rbm93bjEQMA4GA1UEBxMHVW5rbm93bjENMAsGA1UEChMEUWxpazEQMA4GA1UECxMHVW5rbm93bjEUMBIGA1UEAxMLd3d3LmlkcC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC/o7lEgfXyOayF5b7DK30iOdQx160upf9JUUmsf6GNDg8/x4UIFchl0/ngQbtV1nMtKLGcfN1kumR/k6aYQOvn9Mx1VWkEVr8aQMJsmiaPbRSgH1wlrKH/JTeXDAOT06RQLqeMl24cTl7z/7aL/2ddGjusxbKVNn41XNrKzzRURMCMwgCJb/X9oHxYsR/dX5aV1V5PXt8LGMNC4Zn9a/4zMPstxNkQvgdNw5CIBaI8veWxL12ouFmneZsuGFdquGKJ0oA7MROJds3Ufxk37HMfPwgWFzk2PhoN+7ryCi7nJwv7X8Yb8n/qf4jcO1nMVWqAaoXl3z3S4XG0gq/nVhN3AgMBAAGjITAfMB0GA1UdDgQWBBTRxbSJx4SM0qjhNCZky7sP0mRRXzANBgkqhkiG9w0BAQsFAAOCAQEAQmwXgOmrPIVhuTlqQMhrRZZm87oG9e/PUGZKhReNObdBXjLTCWtrR/uNDYRBtNgJE+RU+i+yoDwOWTCD8qHp7fI6LrmLtnBu+E86eE2q44gANiKuB4mFtZt/zywSkPUzlUOfFzOXBvNXtVTQI9yO5vyKfuCE6OJmj0SV1yWHmWnxVDMHxrku/Gqce7TI/oW4gbbrme8pSb06Tc++1Ag6PmWkEMPzMz7YBZ55XHx++JjJZ7TkAGOYPEEgSXE04vCRaOlkPmpWqEQqT9cf9n1JtIQf7BuG7LIoSjmxqsOK3P6moenQfeUi8MyNP4GThSSpm/YruWMe3230fyVCckM+mQ=="
            }
        }
    },
    production: {
        passport: {
            strategy: 'saml',
            saml: {
                protocol: 'https://',
                host: 'evaluation.qlik.com',
                path: 'https://evaluation.qlik.com/api/login/acs',                
                entryPoint: 'https://qlikid-dev.qlik.com/portal/evaluation',
                logoutUrl: 'https://qlikid-dev.qlik.com/logout?sp=evaluation',
                logoutCallbackUrl: 'https://evaluation.qlik.com/api/logout/acs',
                issuer: 'www.idp.com',
                cert: "MIIDbzCCAlegAwIBAgIEGzq3PTANBgkqhkiG9w0BAQsFADBoMQswCQYDVQQGEwJHQjEQMA4GA1UECBMHVW5rbm93bjEQMA4GA1UEBxMHVW5rbm93bjENMAsGA1UEChMEUWxpazEQMA4GA1UECxMHVW5rbm93bjEUMBIGA1UEAxMLd3d3LmlkcC5jb20wHhcNMTcwODA0MDkxMDA4WhcNMjcwODAyMDkxMDA4WjBoMQswCQYDVQQGEwJHQjEQMA4GA1UECBMHVW5rbm93bjEQMA4GA1UEBxMHVW5rbm93bjENMAsGA1UEChMEUWxpazEQMA4GA1UECxMHVW5rbm93bjEUMBIGA1UEAxMLd3d3LmlkcC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC/o7lEgfXyOayF5b7DK30iOdQx160upf9JUUmsf6GNDg8/x4UIFchl0/ngQbtV1nMtKLGcfN1kumR/k6aYQOvn9Mx1VWkEVr8aQMJsmiaPbRSgH1wlrKH/JTeXDAOT06RQLqeMl24cTl7z/7aL/2ddGjusxbKVNn41XNrKzzRURMCMwgCJb/X9oHxYsR/dX5aV1V5PXt8LGMNC4Zn9a/4zMPstxNkQvgdNw5CIBaI8veWxL12ouFmneZsuGFdquGKJ0oA7MROJds3Ufxk37HMfPwgWFzk2PhoN+7ryCi7nJwv7X8Yb8n/qf4jcO1nMVWqAaoXl3z3S4XG0gq/nVhN3AgMBAAGjITAfMB0GA1UdDgQWBBTRxbSJx4SM0qjhNCZky7sP0mRRXzANBgkqhkiG9w0BAQsFAAOCAQEAQmwXgOmrPIVhuTlqQMhrRZZm87oG9e/PUGZKhReNObdBXjLTCWtrR/uNDYRBtNgJE+RU+i+yoDwOWTCD8qHp7fI6LrmLtnBu+E86eE2q44gANiKuB4mFtZt/zywSkPUzlUOfFzOXBvNXtVTQI9yO5vyKfuCE6OJmj0SV1yWHmWnxVDMHxrku/Gqce7TI/oW4gbbrme8pSb06Tc++1Ag6PmWkEMPzMz7YBZ55XHx++JjJZ7TkAGOYPEEgSXE04vCRaOlkPmpWqEQqT9cf9n1JtIQf7BuG7LIoSjmxqsOK3P6moenQfeUi8MyNP4GThSSpm/YruWMe3230fyVCckM+mQ=="
            }
        }
    }
};