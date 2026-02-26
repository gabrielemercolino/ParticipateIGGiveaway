const GIVEAWAYS_API_URL =
  'https://ig-giveaway-server.onrender.com/api/getActiveGives';

export function fetchGiveaways(): Promise<Map<string, string[]>> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      url: GIVEAWAYS_API_URL,
      headers: { 'Content-Type': 'application/json' },
      onload: (response: Tampermonkey.Response<unknown>) => {
        try {
          const text = response.responseText ?? response.response;
          const data = JSON.parse(text);
          resolve(new Map(Object.entries(data)));
        } catch (e) {
          reject(
            new Error(
              'Errore parsing risposta API: ' +
                (e instanceof Error ? e.message : String(e)),
            ),
          );
        }
      },
      onerror: (err: Tampermonkey.ErrorResponse) => {
        reject(
          new Error('API error: ' + (err?.error || 'Unknown error')),
        );
      },
    });
  });
}
