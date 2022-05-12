rm -rf docs
npm run build
cp -R dist docs
git add dist
git add docs
git commit -m "adding deploy files"
git push