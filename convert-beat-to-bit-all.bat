@echo off
REM Comprehensive script to convert beat/beats back to bit/bits everywhere

echo ========================================
echo Converting BEAT/BEATS back to BIT/BITS
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Renaming component files...
cd apps\frontend\src\pages

REM Rename admin page
if exist "admin\BeatsPage.tsx" ren "admin\BeatsPage.tsx" "BitsPage.tsx"

REM Rename director beat files
if exist "director\beats\BeatDetailsPage.tsx" ren "director\beats\BeatDetailsPage.tsx" "BitDetailsPage.tsx"
if exist "director\beats\BeatGuardsView.tsx" ren "director\beats\BeatGuardsView.tsx" "BitGuardsView.tsx"
if exist "director\beats\BeatsListPage.tsx" ren "director\beats\BeatsListPage.tsx" "BitsListPage.tsx"
if exist "director\beats\EditBeatPage.tsx" ren "director\beats\EditBeatPage.tsx" "EditBitPage.tsx"

REM Rename manager beat files
if exist "manager\beats\BeatDetailsPage.tsx" ren "manager\beats\BeatDetailsPage.tsx" "BitDetailsPage.tsx"
if exist "manager\beats\BeatsListPage.tsx" ren "manager\beats\BeatsListPage.tsx" "BitsListPage.tsx"
if exist "manager\beats\EditBeatPage.tsx" ren "manager\beats\EditBeatPage.tsx" "EditBitPage.tsx"

REM Rename secretary beat files  
if exist "secretary\beats\BeatsListPage.tsx" ren "secretary\beats\BeatsListPage.tsx" "BitsListPage.tsx"
if exist "secretary\beats\CreateBeatPage.tsx" ren "secretary\beats\CreateBeatPage.tsx" "CreateBitPage.tsx"
if exist "secretary\beats\EditBeatPage.tsx" ren "secretary\beats\EditBeatPage.tsx" "EditBitPage.tsx"

REM Rename supervisor beat files
if exist "supervisor\beats\MyBeatsPage.tsx" ren "supervisor\beats\MyBeatsPage.tsx" "MyBitsPage.tsx"

cd "%~dp0"
echo Done renaming files!
echo.

echo [2/4] Converting display text in frontend...
powershell -ExecutionPolicy Bypass -Command ^
"Get-ChildItem -Path '.\apps\frontend\src' -Include *.tsx,*.ts -Recurse | ForEach-Object { ^
    $content = Get-Content $_.FullName -Raw -Encoding UTF8; ^
    $original = $content; ^
    $content = $content -creplace '\bBEAT\b', 'BIT'; ^
    $content = $content -creplace '\bBEATS\b', 'BITS'; ^
    $content = $content -creplace '\bbeats\b', 'bits'; ^
    $content = $content -creplace '\bBeats\b', 'Bits'; ^
    $content = $content -creplace '\bbeat\b', 'bit'; ^
    $content = $content -creplace '\bBeat\b', 'Bit'; ^
    $content = $content -replace '\"beat\"', '\"bit\"'; ^
    $content = $content -replace \"'beat'\", \"'bit'\"; ^
    $content = $content -replace '\"beats\"', '\"bits\"'; ^
    $content = $content -replace \"'beats'\", \"'bits'\"; ^
    $content = $content -replace '>beat<', '>bit<'; ^
    $content = $content -replace '>beats<', '>bits<'; ^
    $content = $content -replace '>Beat<', '>Bit<'; ^
    $content = $content -replace '>Beats<', '>Bits<'; ^
    if ($content -ne $original) { ^
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline; ^
        Write-Host \"Updated: $($_.FullName)\"; ^
    } ^
}"

echo.
echo [3/4] Fixing component exports...
powershell -ExecutionPolicy Bypass -Command ^
"Get-ChildItem -Path '.\apps\frontend\src\pages' -Include *BitsPage.tsx,*BitDetailsPage.tsx,*BitGuardsView.tsx,*EditBitPage.tsx,*CreateBitPage.tsx,*MyBitsPage.tsx -Recurse | ForEach-Object { ^
    $content = Get-Content $_.FullName -Raw -Encoding UTF8; ^
    $content = $content -replace 'export default ([A-Za-z]+)BeatsPage', 'export default `$1BitsPage'; ^
    $content = $content -replace 'function ([A-Za-z]+)BeatsPage', 'function `$1BitsPage'; ^
    $content = $content -replace 'const ([A-Za-z]+)BeatsPage', 'const `$1BitsPage'; ^
    $content = $content -replace 'export.*\{.*BeatsPage.*\}', 'export { BitsPage }'; ^
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline; ^
    Write-Host \"Fixed exports in: $($_.FullName)\"; ^
}"

echo.
echo [4/4] Updating supervisor index exports...
if exist "apps\frontend\src\pages\supervisor\index.ts" (
    powershell -ExecutionPolicy Bypass -Command ^
    "$content = Get-Content '.\apps\frontend\src\pages\supervisor\index.ts' -Raw -Encoding UTF8; ^
     $content = $content -replace 'MyBeatsPage', 'MyBitsPage'; ^
     Set-Content -Path '.\apps\frontend\src\pages\supervisor\index.ts' -Value $content -Encoding UTF8 -NoNewline"
    echo Updated supervisor index.ts
)

echo.
echo ========================================
echo CONVERSION COMPLETE!
echo ========================================
echo.
echo All beat/beats references converted back to bit/bits
echo Component files renamed
echo Display text updated
echo.
pause
