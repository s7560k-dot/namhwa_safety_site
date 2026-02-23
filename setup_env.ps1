$javaPath = "C:\Users\elcid-office\Downloads\jdk-21.0.10+7"
$mavenPath = "C:\Users\elcid-office\Downloads\apache-maven-3.9.12-bin\apache-maven-3.9.12"

[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")
[Environment]::SetEnvironmentVariable("MAVEN_HOME", $mavenPath, "User")

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = $currentPath

if ($currentPath -notlike "*$javaPath\bin*") {
    $newPath += ";$javaPath\bin"
}
if ($currentPath -notlike "*$mavenPath\bin*") {
    $newPath += ";$mavenPath\bin"
}

[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host "User Environment variables updated successfully."
Write-Host "JAVA_HOME set to: $javaPath"
Write-Host "MAVEN_HOME set to: $mavenPath"
Write-Host "Please restart your terminal (or VS Code) to apply changes."
