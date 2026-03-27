#!/bin/sh
# Neden: Xcode Cloud sunucularında Node.js ve bağımlılıkları kurarak .xcworkspace dosyasını dinamik olarak üretiriz.

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE

# Gerekli ortam araçlarını kur
brew install node
brew install cocoapods

# Betik ios/ci_scripts içinde çalıştığı için, proje ana dizinine dön (2 üst klasör)
cd ../../

# JavaScript bağımlılıklarını kur (Eğer yarn kullanıyorsanız 'npm install' yerine 'yarn install' yazın)
npm install

# iOS klasörüne dön ve pod'ları kur
cd ios
pod install