import { useEffect, useState } from "react";

function App() {
  const [harga, setHarga] = useState(null);
  const [error, setError] = useState(null);
  const [gram, setGram] = useState(1);
  const [prevHarga, setPrevHarga] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiKeys = ["goldapi-1xnsdsmgbbicj5-io", "goldapi-1xnsdsmgbca2rn-io"];

  const fetchHarga = async () => {
    try {
      setLoading(true);
      // Ambil kurs USD → IDR
      const kursRes = await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=IDR"
      );
      const kursData = await kursRes.json();
      const kursIDR = kursData.rates.IDR;

      let data = null;
      let success = false;

      for (let key of apiKeys) {
        try {
          const res = await fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: {
              "x-access-token": key,
              "Content-Type": "application/json",
            },
          });
          if (!res.ok) continue;
          data = await res.json();
          success = true;
          break;
        } catch {}
      }

      if (!success) throw new Error("Gagal fetch harga emas");

      const usdPerGram24k = data.price_gram_24k;
      const idrPerGram24k = usdPerGram24k * kursIDR;

      const marginJual = 1.039;
      const marginBuyback = 1.002;

      const jual = idrPerGram24k * marginJual;
      const buyback = idrPerGram24k * marginBuyback;

      setPrevHarga(harga);
      setHarga({
        kurs: kursIDR,
        xauusd: data.price,
        idrPerGram: idrPerGram24k,
        pegadaian: { jual, buyback },
        timestamp: data.timestamp,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update title saat harga berubah
  useEffect(() => {
    if (harga) {
      const perubahan =
        harga && prevHarga
          ? ((harga.idrPerGram - prevHarga.idrPerGram) / prevHarga.idrPerGram) *
            100
          : 0;

      const symbol = "XAUUSD";
      const value = harga.xauusd.toFixed(2);
      const persen = perubahan.toFixed(2);

      document.title = `${symbol} ${value} (${
        perubahan >= 0 ? "+" : ""
      }${persen}%)`;
    }
  }, [harga, prevHarga]);

 
  const perubahan =
    harga && prevHarga
      ? ((harga.idrPerGram - prevHarga.idrPerGram) / prevHarga.idrPerGram) * 100
      : null;

  const formatTimestamp = (ts) => {
    if (!ts) return "-";
    const date = new Date(ts * 1000);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-gray-100 p-6">
      <h1 className="text-3xl font-extrabold text-center text-yellow-700 mb-8 drop-shadow">
        💰 Harga Emas Analytic
      </h1>

      {error && <p className="text-red-600 text-center font-medium">{error}</p>}

      {loading ? (
        <div className="flex justify-center items-center my-6">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {harga && (
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {/* Info Pasar */}
              <div className="bg-white shadow-lg rounded-2xl p-6 border border-yellow-200 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  📊 Info Pasar
                </h2>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between border-b">
                    <span className="font-medium text-gray-600">
                      Kurs USD/IDR
                    </span>
                    <span className="font-semibold text-gray-800">
                      Rp {harga.kurs.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex justify-between border-b">
                    <span className="font-medium text-gray-600">
                      Spot XAU/USD
                    </span>
                    <span className="font-semibold text-gray-800">
                      {harga.xauusd.toFixed(2)} USD/oz
                    </span>
                  </div>

                  <div className="flex justify-between border-b">
                    <span className="font-medium text-gray-600">
                      Harga 24K/gram
                    </span>
                    <span className="font-semibold text-gray-800">
                      Rp {Math.round(harga.idrPerGram).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {perubahan !== null && (
                    <div className="flex justify-between border-b">
                      <span className="font-medium text-gray-600">
                        Perubahan
                      </span>
                      <span
                        className={
                          perubahan >= 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {perubahan >= 0 ? "⬆️ Naik" : "⬇️ Turun"}{" "}
                        {perubahan.toFixed(2)}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-b">
                    <span className="font-medium text-gray-600">
                      Update terakhir
                    </span>
                    <span className="text-gray-500">
                      {formatTimestamp(harga.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={fetchHarga}
                  disabled={loading}
                  className="mt-4 px-4 w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg shadow transition"
                >
                  {loading ? "⏳ Mengambil data..." : "🔄 Refresh"}
                </button>
              </div>

              {/* Simulasi Pegadaian */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-4">🏦 Simulasi</h2>

                <label className="block mb-3 font-medium">
                  <div className="flex justify-between items-center">
                    <p>Berat (gram):</p>
                    {gram > 1 && (
                      <button
                        onClick={() => setGram(1)}
                        className="text-sm"
                      >
                        <p className="cursor-pointer hover:text-gray-200  hover:underline">
                          Reset
                        </p>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={1000}
                    value={gram}
                    onChange={(e) => setGram(Number(e.target.value))}
                    className="mt-1 w-full outline-yellow-400 border-gray-400 px-2 p-1 text-black rounded border"
                  />
                </label>

                <div className="flex justify-between gap-6">
                  <div>
                    <p className="text-lg font-semibold">
                      Harga beli ({gram} gr):{" "}
                    </p>
                    <span className="text-2xl">
                      Rp{" "}
                      {Number(
                        (harga.pegadaian.jual * gram).toFixed(0)
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div>
                    <p className="text-lg font-semibold">
                      Harga jual ({gram} gr):{" "}
                    </p>
                    <span className="text-2xl">
                      Rp{" "}
                      {Number(
                        (harga.pegadaian.buyback * gram).toFixed(0)
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <a
                  href="https://digital.pegadaian.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block w-full text-center border-white border px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition"
                >
                  Lihat Harga Pegadaian
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* Chart */}
      <h2 className="text-2xl font-semibold text-center mt-12 mb-6 text-gray-800">
        📈 Grafik FOREXCOM:XAUUSD
      </h2>
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        <iframe
          src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_xau&symbol=FOREXCOM:XAUUSD&interval=15&hidesidetoolbar=1&theme=light&style=1&timezone=Asia%2FJakarta&locale=in"
          className="w-full h-[500px] border-0"
          title="TradingView Chart"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
