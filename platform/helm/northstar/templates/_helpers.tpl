{{- define "northstar.labels" -}}
app.kubernetes.io/part-of: northstar-commerce
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "northstar.image" -}}
{{- $root := index . 0 -}}
{{- $name := index . 1 -}}
{{- $config := index . 2 -}}
{{- $imageName := default $name $config.imageName -}}
{{- $digest := default $root.Values.global.imageDigest $config.digest -}}
{{- required (printf "services.%s.digest or global.imageDigest must be an immutable sha256 digest" $name) $digest -}}
{{ $root.Values.global.registry }}/{{ $imageName }}@{{ $digest }}
{{- end }}
