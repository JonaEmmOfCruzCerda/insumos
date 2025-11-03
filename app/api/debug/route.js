export async function GET() {
  try {
    const status = {
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      github_configured: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
      github_repo: process.env.GITHUB_REPO || 'No configurado',
      node_version: process.version,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Status del sistema:', status);

    return Response.json(status);
  } catch (error) {
    console.error('❌ Error en debug endpoint:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}