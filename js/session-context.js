const params = new URLSearchParams(window.location.search);

export const sessionContext = {
    campaignId: Number(sessionStorage.getItem('activeCampaignId')) || null,
    userId: getUserIdFromToken(),
    isDM: window.location.pathname.endsWith("DMScreen.html")
};
