npx nest generate module modules/users --no-spec
npx nest generate service modules/users --no-spec
npx nest generate controller modules/users --no-spec

npx nest generate module modules/health --no-spec
npx nest generate controller modules/health --no-spec

npx nest generate module shared/upload --no-spec
npx nest generate service shared/upload --no-spec

npx nest generate module shared/email --no-spec
npx nest generate service shared/email --no-spec

npx nest generate module shared/queue --no-spec
npx nest generate service shared/queue --no-spec

npx nest generate module shared/audit --no-spec
npx nest generate service shared/audit --no-spec
