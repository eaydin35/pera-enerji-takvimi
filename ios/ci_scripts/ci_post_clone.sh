#!/bin/sh
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE

brew install node
brew install cocoapods

cd ../../
npm install

cd ios
# KİLİT NOKTA: Apple sunucusunun kendi kurduğu Node.js yolunu bulup,
# derleme esnasında kaybolmaması için sadece sunucuda geçerli bir adres dosyası üretiyoruz.
echo "export NODE_BINARY=$(command -v node)" > .xcode.env.local

pod install