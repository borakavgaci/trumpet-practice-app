# Mikrofon notasının akort bilgisi

Mikrofonun ölçtüğü frekans yuvarlanmadan korunur. En yakın nota adı ile bu notaya
göre ne kadar pes veya tiz çalındığı ayrı bilgilerdir. Örneğin 432 Hz hâlâ A4'e
en yakındır, ancak A4'ün 440 Hz referansından yaklaşık 31,8 cent pestir.

## Veri akışı

1. `usePitchDetection` ses seviyesi ve clarity kontrollerinden geçen frekansı Hz
   olarak verir. Sessizlikte veya güvenilir bir ölçüm yokken sonuç null olur.
2. `MainScreen`, `getPitchTuning` ile bu frekanstan akort bilgisini türetir.
   Mikrofon kapalıysa akort bilgisi de null olur. Bunun için ikinci bir state yoktur.
3. `NoteDisplay` nota adlarını, ölçülen frekansı ve işaretli cent sapmasını gösterir.
   Bar tasarımı henüz eklenmedi; bar için gereken veriler hazırdır.

## PitchTuning alanları

| Alan | Anlamı |
| --- | --- |
| frequency | Ölçülen gerçek frekans, Hz. |
| note | Otomatik seçilen en yakın concert nota ve oktav. |
| referenceFrequency | Bu notanın ideal frekansı; A4 = 440 Hz. |
| cents | Negatifse pes, pozitifse tiz; sıfırsa referansla aynı. Yuvarlanmadan saklanır. |
| direction | flat / in-tune / sharp. Başlangıçta ±5 cent akortta kabul edilir. |
| lowerNote | Merkezden bir yarım ses aşağıdaki nota, oktavıyla. |
| upperNote | Merkezden bir yarım ses yukarıdaki nota, oktavıyla. |
| barPosition | 0–1 arasında çubuk konumu. 0 sol uç, 0,5 merkez, 1 sağ uç. |

±5 cent toleransı bir uygulama tercihidir; `IN_TUNE_TOLERANCE_CENTS` sabitinden
değiştirilebilir. Akortta kabul edilen küçük sapmalar da sayısal olarak korunur.
Yalnızca ekrandaki metin bir ondalık basamağa yuvarlanır.

## İlerideki bar

Merkez A4 olduğunda sol etiket G#4 (-100 cent), sağ etiket A#4 (+100 cent) olur.
432 Hz için konum yaklaşık 0,341'dir: çubuk merkezin solunda durur.
440 Hz için konum 0,5'tir: çubuk merkezdedir. Konum frekans farkına değil,
müzikal aralığa (cent) göre hesaplanır.

Merkez otomatik seçildiği için sapma normalde -50 ile +50 cent arasındadır.
Bu nedenle çubuk, ±100 cent ölçeğinin ortadaki yarısında hareket eder.
Komşu nota daha yakın olduğunda merkez ve iki etiket de o notaya geçer.
Bu sürümde hedef nota kilitleme yoktur; A4 merkezini her koşulda sabit tutmak
istenirse sonradan ayrıca hedef nota seçimi eklenmelidir.

Veriler concert nota sistemindedir. Bb trompet görünümünde merkez ve komşu nota
etiketleri mevcut `transposeNote` ile +2 yarım ses çevrilir; cent sapması ve
bar konumu aynı kalır. Böylece concert A4, trompet için B4 olarak gösterilir.

Cent hesabı: 1200 × log2(ölçülen frekans / referans frekansı).
Bir oktav 1200, bir yarım ses 100 centtir. Frekans ile cent arasındaki ilişki
[W3C Web Audio tanımındaki detune hesabıyla](https://www.w3.org/TR/webaudio/#dom-oscillatornode-detune)
aynıdır.

## Kontrol

`npm test`, gerçek hesaplama fonksiyonlarını ve NoteDisplay çıktısını kontrol eder:
tam nota, pes/tiz sapma, küçük sapmalar, tolerans, oktav sınırları,
otomatik merkez değişimi, geçersiz frekanslar ve mikrofon kapalı durumu.
