import { getToken } from 'next-auth/jwt';

export async function getServerSideProps(context) {
  const token = await getToken({ req: context.req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return { redirect: { destination: '/signin?callbackUrl=' + context.resolvedUrl, permanent: false } };
  }
  return { props: {} };
}
