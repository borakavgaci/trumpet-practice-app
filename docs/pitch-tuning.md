# Mikrofon notasının akort bilgisi

Nota adı, frekans ve bar konumu birbirinden ayrı bilgilerdir. Frekans tam notaya
yuvarlanmaz. Örneğin 432 Hz, A4'e yakın olmakla birlikte 440 Hz referansına göre
yaklaşık 31,8 cent pestir.

## Veri akışı

1. `usePitchDetection`, 2048 örneklik ses penceresinde Pitchy ile frekansı bulur.
   Ses seviyesi en az 0,01 ve clarity en az 0,9 olmalıdır.
2. Hook içindeki `createPitchTracker`, frekansı yarım sese yuvarlamadan takip eder.
   Beş ölçümün medyanı kısa hata kümelerini bastırır. Logaritmik perde üzerinde
   100 ms zaman sabitli yumuşatma, hızlı dalgalanmaları azaltır. 350 centten büyük
   ani atlamalar, yeni perde 100 ms doğrulanmadan kabul edilmez.
3. Nota adı ancak mevcut notadan 65 cent uzaklaşılıp yeni aday en az 80 ms
   korunduğunda değişir. Böylece iki notanın ortasında isimler gidip gelmez.
4. Barın referansı ayrıca korunur. Nota adı değiştiğinde çubuk otomatik olarak
   merkeze dönmez. Bar, yumuşatılmış sürekli frekanstan hesaplanır.
5. `MainScreen`, hook'un verdiği tuning bilgisini ve +2 yarım seslik Bb trompet
   karşılığını `NoteDisplay` bileşenine iletir.

Hook'un `pitch` alanı kabul edilen ham frekanstır; `tuning.frequency` gösterimde
kullanılan yumuşatılmış frekanstır. Volume ve clarity de aynı ölçümle güncellenir.
Yumuşatma zaman aralığına bağlıdır; ekran yenileme sayısına bağlı bir katsayı yoktur.

250 ms'den kısa ses/clarity kopmalarında son görünüm korunur. Daha uzun sessizlikte
hem nota hem bar referansı sıfırlanır. Mikrofon kapatıldığında beklemeden temizlenir.
Her yeni mikrofon stream'i ayrı bir takip oturumu başlatır.

## PitchTuning alanları

| Alan | Anlamı |
| --- | --- |
| frequency | Gösterimde kullanılan frekans, Hz. |
| note | Kararlı biçimde takip edilen concert nota ve oktav. |
| referenceFrequency | Gösterilen notanın ideal frekansı; A4 = 440 Hz. |
| cents | Gösterilen notaya göre sapma. Negatifse pes, pozitifse tiz. |
| direction | flat / in-tune / sharp. ±10 cent akortta kabul edilir. |
| gaugeNote | Barın ortasındaki referans nota. |
| gaugeCents | Barın referansına göre sapma. |
| lowerNote | Bar merkezinden iki yarım ses aşağıdaki uç etiket. |
| upperNote | Bar merkezinden iki yarım ses yukarıdaki uç etiket. |
| barPosition | 0–1 arasında çubuk konumu: 0 sol uç, 0,5 merkez, 1 sağ uç. |

Akort toleransı `IN_TUNE_TOLERANCE_CENTS` sabitindedir. Yeşil bölgenin genişliği
ve çubuğun rengi de bu sabiti kullanır. Akortta sayılan küçük sapmalar sayısal olarak
korunur; yalnızca ekrandaki metin bir ondalık basamağa yuvarlanır.

## Akıcı nota geçişi

A4 ile başlayan bir seste bar G4 / G#4 / A4 / A#4 / B4 ölçeğini kullanır.
A4'ten A#4'e yavaşça çıkarken çubuk %50'den %75'e ilerler; 50 centte merkeze
sıçramaz. B4'e kadar çıkıldığında sağ uca ulaşır. Aynı davranış aşağı yönde de geçerlidir.
Üstteki nota adı yeni notayı onayladığında A#4 olabilir, barın merkez etiketi A4
olarak kalır. Sayısal SAPMA alanında hangi notaya göre hesap yapıldığı yazılır.
Barın erişilebilir açıklaması ise kendi merkez notasını ve sapmasını belirtir.

Çubuk ±200 cent ölçeğini kullanır. Perde bu aralıktan çıkıp merkezden 210 centten
fazla uzaklaşırsa bar yeni aralığa geçer. Bu küçük ek pay, uçlarda ileri geri ölçek
değişimini önler. Aralık `GAUGE_RANGE_CENTS` ile veri hesabı, animasyon ve görünüm
arasında paylaşılır. Konum = 0,5 + gaugeCents / 400; ekrandaki sonuç 0–1'e sınırlandırılır.

Bar, geniş ekranda kullanılabilir alanın %84'ünü kaplar ve en fazla 1000 px olur.
İç kenar boşlukları uç etiketlerin kesilmesini önler; dar ekranda genişliğe uyum sağlar.
Ölçek genişliği de artırıldığı için iki kat nota aralığı, küçük sapmaları okunmaz hale
getirmez. Merkez referansı büyük yazılır; yalnızca bu referansın ±10 cent bölgesi
yeşil zeminle gösterilir. Diğer tam notalar çizgilerle belirtilir. Yuvarlak başlı
gösterge herhangi bir tam notaya ±10 cent yakınsa yeşil, aradaysa kehribar olur.

Görsel hareket, ölçüm döngüsünden ayrı `useGaugeMotion` döngüsünde her animasyon
karesinde hesaplanır. `createGaugeMotion` yay sönümlemesi, hız ve ivme sınırı ile
çubuğu hedefe taşır. 35 centten küçük farklarda sakin tepki korunur; daha büyük
mesafelerde tepki kademeli hızlanır ve 150 centte en hızlı ayara ulaşır.
Ölçüm filtresinin ardından görsel hareket de yumuşatıldığı için
bilinçli olarak kısa bir takip gecikmesi vardır; her karede son ölçüme atlanmaz.

Çubuk aynı DOM öğesi olarak kalır. Yakın bir aralığa geçildiğinde ölçek ve nota
etiketleri de kayar; yeni referans için çubuk yeniden oluşturulmaz. Çok uzak bir
notaya geçişte etiketler yeni aralığa alınır, çubuğun mevcut konum ve hızı korunur.
Uzun bir kare gecikmesi, sonraki karede ani bir sıçramaya dönüşmez. 1,5 centten
küçük hedef değişimleri mikro titreşim oluşturmaz. Azaltılmış hareket tercihi
açıksa görsel animasyon atlanır; ölçüm filtresi çalışmaya devam eder.

Görsel hız/ivme, sönümleme ve titreşim eşiği `GAUGE_MOTION` içindedir.

Nota değişimi, filtre, sessizlik ve bar aralığı ayarları `PITCH_TRACKING` içindedir.
`getPitchTuning` tek başına çağrılırsa en yakın notayı kullanır. Takip sırasında
`noteMidi` ve `gaugeMidi` seçenekleriyle kararlı nota ve bar referansı ayrı verilir.

Bb trompet karşılığı aynı kararlı concert notadan +2 yarım sesle hesaplanır.
Örneğin concert A4'ün karşılığı B4'tür.

Cent hesabı: 1200 × log2(frekans / referans frekansı).
Bir oktav 1200, bir yarım ses 100 centtir. Frekans ile cent arasındaki ilişki
[W3C Web Audio detune hesabıyla](https://www.w3.org/TR/webaudio/#dom-oscillatornode-detune)
aynıdır.

## Kontrol

`npm test` tam nota, tolerans, pes/tiz sapma, tek karelik oktav hataları,
nota sınırındaki kararlılık, yükselen/alçalan glissando, oktav sınırları,
barın aralık değiştirmesi, hız sınırı, gürültü altında hareket, farklı ekran yenileme
hızları, uzun kare duraklamaları, sessizlik ve mikrofon kapalı durumlarını kontrol eder.
