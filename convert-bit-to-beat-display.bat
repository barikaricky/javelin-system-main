@echo off
REM Windows batch script to convert bit/bits to beat/beats in frontend display text

echo Converting bit/bits to beat/beats in frontend display text...
cd /d "%~dp0"

REM Use PowerShell for better text processing
powershell -ExecutionPolicy Bypass -Command ^
"Get-ChildItem -Path '.\apps\frontend\src' -Include *.tsx,*.ts -Recurse | ForEach-Object { ^
    $content = Get-Content $_.FullName -Raw -Encoding UTF8; ^
    $original = $content; ^
    $content = $content -creplace '\bBIT\b', 'BEAT'; ^
    $content = $content -creplace '\bBITS\b', 'BEATS'; ^
    $content = $content -creplace '\bbits\b', 'beats'; ^
    $content = $content -creplace '\bBits\b', 'Beats'; ^
    $content = $content -creplace '\bbit\b', 'beat'; ^
    $content = $content -creplace '\bBit\b', 'Beat'; ^
    $content = $content -replace '\"bit\"', '\"beat\"'; ^
    $content = $content -replace \"'bit'\", \"'beat'\"; ^
    $content = $content -replace '\"bits\"', '\"beats\"'; ^
    $content = $content -replace \"'bits'\", \"'beats'\"; ^
    $content = $content -replace '>bit<', '>beat<'; ^
    $content = $content -replace '>bits<', '>beats<'; ^
    $content = $content -replace '>Bit<', '>Beat<'; ^
    $content = $content -replace '>Bits<', '>Beats<'; ^
    if ($content -ne $original) { ^
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline; ^
        Write-Host \"Updated: $($_.FullName)\"; ^
    } ^
}"

echo.
echo Conversion complete!
echo.
echo Note: This script converts display text only.
echo Variable names and technical code remain unchanged for stability.
pause
