const params = new URLSearchParams(window.location.search);

export const sessionContext = {
    campaignId: Number(params.get('campaignId')) || null,
    userId: Number(params.get('userId')) || 1,
    isDM: window.location.pathname.endsWith("DMScreen.html")
};
