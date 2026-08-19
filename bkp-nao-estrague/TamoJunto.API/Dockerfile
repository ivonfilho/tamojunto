# Use the official .NET 8.0 SDK image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory
WORKDIR /app

# Copy all project files
COPY . .

# Restore dependencies
RUN dotnet restore

# Build and publish the application
RUN dotnet publish TamoJunto.API/TamoJunto.API.csproj -c Release -o out

# Use the official .NET 8.0 runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Set the working directory
WORKDIR /app

# Copy the published application
COPY --from=build /app/out .

# Expose the port
EXPOSE 80
EXPOSE 443

# Set the entry point
ENTRYPOINT ["dotnet", "TamoJunto.API.dll"]
